import { supabase } from './supabaseClient.js';
import { getProfilesByIds } from './profiles.js';
import { createNotification } from './notifications.js';

// friendships: id, requester_id, addressee_id, status ('pending'|'accepted'|'declined'), created_at, updated_at

export async function sendFriendRequest(currentUserId, targetUserId) {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  await createNotification({ userId: targetUserId, actorId: currentUserId, type: 'friend_request' }).catch(() => {});
  return data;
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase.from('friendships').delete().eq('id', requestId);
  if (error) throw error;
}

export async function respondFriendRequest(requestId, accept, currentUserId) {
  if (!accept) {
    const { error } = await supabase.from('friendships').delete().eq('id', requestId);
    if (error) throw error;
    return null;
  }
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  if (data) {
    const otherId = data.requester_id === currentUserId ? data.addressee_id : data.requester_id;
    await createNotification({ userId: otherId, actorId: currentUserId, type: 'friend_accept' }).catch(() => {});
  }
  return data;
}

export async function removeFriendship(friendshipId) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function loadFriendGraph(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  const rows = data || [];

  const accepted = rows.filter(r => r.status === 'accepted');
  const received = rows.filter(r => r.status === 'pending' && r.addressee_id === userId);
  const sent = rows.filter(r => r.status === 'pending' && r.requester_id === userId);

  const friendIds = accepted.map(r => (r.requester_id === userId ? r.addressee_id : r.requester_id));
  const receivedIds = received.map(r => r.requester_id);
  const sentIds = sent.map(r => r.addressee_id);

  const allIds = [...new Set([...friendIds, ...receivedIds, ...sentIds])];
  const profiles = await getProfilesByIds(allIds);
  const byId = Object.fromEntries(profiles.map(p => [p.id, p]));

  return {
    friends: accepted.map(r => ({ friendshipId: r.id, profile: byId[r.requester_id === userId ? r.addressee_id : r.requester_id] })).filter(f => f.profile),
    received: received.map(r => ({ requestId: r.id, profile: byId[r.requester_id] })).filter(f => f.profile),
    sent: sent.map(r => ({ requestId: r.id, profile: byId[r.addressee_id] })).filter(f => f.profile),
  };
}

export async function relationshipWith(userId, targetId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}
