import { supabase } from './supabaseClient.js';
import { createNotification } from './notifications.js';
import { getProfilesByIds } from './profiles.js';

export async function followUser(followerId, followingId) {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
  createNotification({ userId: followingId, actorId: followerId, type: 'new_follower' }).catch(() => {});
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  if (error) throw error;
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function countFollowers(userId) {
  const { count, error } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  if (error) throw error;
  return count || 0;
}

export async function countFollowing(userId) {
  const { count, error } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
  if (error) throw error;
  return count || 0;
}

export async function listFollowers(userId) {
  const { data, error } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
  if (error) throw error;
  return getProfilesByIds((data || []).map((r) => r.follower_id));
}

export async function listFollowing(userId) {
  const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  if (error) throw error;
  return getProfilesByIds((data || []).map((r) => r.following_id));
}

// Utenti da seguire: profili recenti che l'utente corrente non segue ancora
export async function suggestedUsers(currentUserId, limit = 8) {
  const { data: alreadyFollowing } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId);
  const excludeIds = new Set([currentUserId, ...(alreadyFollowing || []).map((r) => r.following_id)]);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .order('created_at', { ascending: false })
    .limit(limit + excludeIds.size);
  if (error) throw error;
  return (data || []).filter((p) => !excludeIds.has(p.id)).slice(0, limit);
}

// Attività: recensioni delle persone che l'utente corrente segue
export async function followingActivity(currentUserId, limit = 30) {
  const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId);
  const ids = (following || []).map((r) => r.following_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
