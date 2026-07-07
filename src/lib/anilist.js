// AniList (https://anilist.co) ha un'API GraphQL pubblica e gratuita, senza
// bisogno di chiave, pensata apposta per essere interrogata anche dal browser.
// La usiamo solo per gli anime, dove TMDB fornisce la foto del doppiatore
// reale invece dell'illustrazione del personaggio.
const ANILIST_URL = 'https://graphql.anilist.co';

const QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      title { romaji english }
      characters(sort: ROLE, perPage: 18) {
        edges {
          voiceActors(language: JAPANESE) {
            name { full }
          }
          node {
            id
            name { full }
            image { large }
          }
        }
      }
    }
  }
`;

// Un titolo TV/film è considerato "anime" se è animazione E di origine/lingua
// giapponese — evita di interrogare AniList per cartoni non giapponesi.
// Usa l'ID del genere TMDB (16 = Animazione) invece del nome, perché il nome
// cambia a seconda della lingua dell'app (es. "Animation" vs "Animazione").
export function isAnimeTitle({ genres, originalLanguage, originCountries }) {
  const isAnimation = (genres || []).some((g) => (typeof g === 'object' ? g.id === 16 : false));
  const isJapanese = originalLanguage === 'ja' || (originCountries || []).includes('JP');
  return isAnimation && isJapanese;
}

export async function fetchAniListCharacters(title) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search: title } }),
  });
  if (!res.ok) throw new Error('ANILIST_ERROR');
  const json = await res.json();
  const edges = json?.data?.Media?.characters?.edges || [];
  return edges
    .filter((e) => e.node?.image?.large)
    .map((e) => ({
      id: e.node.id,
      character: e.node.name?.full || '',
      name: e.voiceActors?.[0]?.name?.full || '',
      profile_path: e.node.image.large,
    }));
}
