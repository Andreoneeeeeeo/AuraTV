import { supabase } from './supabaseClient.js';

export async function isFavorite(userId, mediaType, mediaId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('media_id', mediaId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function addFavorite(userId, mediaType, mediaId, mediaTitle, mediaPoster) {
  const { error } = await supabase.from('favorites').insert({
    user_id: userId, media_type: mediaType, media_id: mediaId, media_title: mediaTitle, media_poster: mediaPoster,
  });
  if (error) throw error;
}

export async function removeFavorite(userId, mediaType, mediaId) {
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('media_type', mediaType).eq('media_id', mediaId);
  if (error) throw error;
}

export async function listFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
