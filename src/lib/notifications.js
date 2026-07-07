import { supabase } from './supabaseClient.js';

export async function createNotification({ userId, actorId, type, data = {} }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    data,
  });
  if (error) throw error;
}

export async function listNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:actor_id ( id, username, display_name, avatar_url )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

export async function countUnread(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count || 0;
}

export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
      onInsert(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}
