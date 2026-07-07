import { supabase } from './supabaseClient.js';

export async function getFavoriteCharacter(userId, mediaType, mediaId) {
  const { data, error } = await supabase
    .from('favorite_characters')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('media_id', mediaId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function setFavoriteCharacter(userId, mediaType, mediaId, { characterName, actorName, profilePath }) {
  const { error } = await supabase.from('favorite_characters').upsert({
    user_id: userId, media_type: mediaType, media_id: mediaId,
    character_name: characterName, actor_name: actorName, profile_path: profilePath,
  }, { onConflict: 'user_id,media_type,media_id' });
  if (error) throw error;
}

export async function removeFavoriteCharacter(userId, mediaType, mediaId) {
  const { error } = await supabase.from('favorite_characters').delete()
    .eq('user_id', userId).eq('media_type', mediaType).eq('media_id', mediaId);
  if (error) throw error;
}
