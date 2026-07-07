import { supabase } from './supabaseClient.js';

const AVATAR_BUCKET = 'avatars';
const BANNER_BUCKET = 'banners';

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId, fields) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isUsernameAvailable(username, excludeUserId) {
  let query = supabase.from('profiles').select('id').eq('username', username);
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !data;
}

async function uploadImage(bucket, userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function uploadAvatar(userId, file) {
  return uploadImage(AVATAR_BUCKET, userId, file);
}

export function uploadBanner(userId, file) {
  return uploadImage(BANNER_BUCKET, userId, file);
}

export async function searchProfiles(query, currentUserId) {
  if (!query || !query.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query.trim()}%`)
    .neq('id', currentUserId)
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function getProfilesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
  if (error) throw error;
  return data || [];
}
