import { supabase } from './supabaseClient.js';

export async function upsertPublicLibraryItem(userId, mediaType, mediaId, mediaTitle, mediaPoster, watchStatus) {
  const { error } = await supabase.from('public_library_items').upsert({
    user_id: userId, media_type: mediaType, media_id: mediaId,
    media_title: mediaTitle, media_poster: mediaPoster,
    watch_status: watchStatus, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,media_type,media_id' });
  if (error) throw error;
}

export async function removePublicLibraryItem(userId, mediaType, mediaId) {
  const { error } = await supabase.from('public_library_items').delete()
    .eq('user_id', userId).eq('media_type', mediaType).eq('media_id', mediaId);
  if (error) throw error;
}

export async function listPublicLibrary(userId) {
  const { data, error } = await supabase
    .from('public_library_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
