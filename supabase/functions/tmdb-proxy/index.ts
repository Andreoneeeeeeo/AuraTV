// Supabase Edge Function — proxy verso TMDB.
//
// Scopo: l'app (nel browser, su Android, su Windows) non conosce mai la vera
// chiave API di TMDB. Chiama invece questa funzione, che gira sui server di
// Supabase; qui — e solo qui — la chiave vera viene letta da una variabile
// d'ambiente segreta e aggiunta alla richiesta verso TMDB. Chi ispeziona il
// codice dell'app o il traffico di rete vede solo l'indirizzo di questa
// funzione, mai la chiave.
//
// Non modificare a mano: si distribuisce con
//   supabase functions deploy tmdb-proxy
// (istruzioni complete nel README).

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE = 'https://api.themoviedb.org/3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!TMDB_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Il server non ha una TMDB_API_KEY configurata. Vedi il README per impostarla.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    if (!path) {
      return new Response(JSON.stringify({ error: 'Parametro "path" mancante.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const sep = path.includes('?') ? '&' : '?';
    const tmdbUrl = `${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}`;

    const tmdbRes = await fetch(tmdbUrl);
    const body = await tmdbRes.text();

    return new Response(body, {
      status: tmdbRes.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
