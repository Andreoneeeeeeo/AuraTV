import { supabase } from './supabaseClient.js';
import { createNotification } from './notifications.js';

export async function listComments(reviewId) {
  const { data, error } = await supabase
    .from('review_comments')
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(reviewId, userId, body, reviewAuthorId, mediaTitle) {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: userId, body })
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .single();
  if (error) throw error;
  if (reviewAuthorId && reviewAuthorId !== userId) {
    createNotification({ userId: reviewAuthorId, actorId: userId, type: 'review_comment', data: { mediaTitle } }).catch(() => {});
  }
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('review_comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function countComments(reviewIds) {
  if (!reviewIds.length) return {};
  const { data, error } = await supabase.from('review_comments').select('review_id').in('review_id', reviewIds);
  if (error) throw error;
  const counts = {};
  (data || []).forEach((r) => { counts[r.review_id] = (counts[r.review_id] || 0) + 1; });
  return counts;
}
