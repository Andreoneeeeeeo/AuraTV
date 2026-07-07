import { supabase } from './supabaseClient.js';

const BUCKET = 'custom-banners';

export async function getCustomBanner(userId, mediaType, mediaId) {
  const { data, error } = await supabase
    .from('custom_banners')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('media_id', mediaId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function setCustomBanner(userId, mediaType, mediaId, bannerUrl, source = 'custom_upload') {
  const { error } = await supabase.from('custom_banners').upsert({
    user_id: userId, media_type: mediaType, media_id: mediaId,
    banner_url: bannerUrl, source, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,media_type,media_id' });
  if (error) throw error;
}

export async function removeCustomBanner(userId, mediaType, mediaId) {
  const { error } = await supabase.from('custom_banners').delete()
    .eq('user_id', userId).eq('media_type', mediaType).eq('media_id', mediaId);
  if (error) throw error;
}

export async function uploadCustomBannerImage(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
