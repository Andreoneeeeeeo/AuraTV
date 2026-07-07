import { supabase } from './supabaseClient.js';

export async function upsertPublicList(listId, userId, { name, description, tags, items, coverPoster }) {
  const { error } = await supabase.from('public_lists').upsert({
    id: listId, user_id: userId, name, description: description || '',
    tags: tags || [], items: items || [], cover_poster: coverPoster || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removePublicList(listId) {
  const { error } = await supabase.from('public_lists').delete().eq('id', listId);
  if (error) throw error;
}

export async function getPublicList(listId) {
  const { data, error } = await supabase
    .from('public_lists')
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .eq('id', listId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function searchPublicLists(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const { data, error } = await supabase
    .from('public_lists')
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .ilike('name', `%${query.trim()}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
