import { supabase } from './supabaseClient.js';
import { createNotification } from './notifications.js';

// reviews: id, user_id, media_type ('show'|'film'), media_id, media_title, media_poster,
//          rating (0.5-5 step .5), body, has_spoilers, likes_count, created_at, updated_at

export async function getMyReview(userId, mediaType, mediaId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('media_id', mediaId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function listReviewsForMedia(mediaType, mediaId, sort = 'recent') {
  let query = supabase
    .from('reviews')
    .select('*, author:user_id ( id, username, display_name, avatar_url )')
    .eq('media_type', mediaType)
    .eq('media_id', mediaId);

  if (sort === 'recent') query = query.order('created_at', { ascending: false });
  else if (sort === 'popular') query = query.order('likes_count', { ascending: false });
  else if (sort === 'highest') query = query.order('rating', { ascending: false });
  else if (sort === 'lowest') query = query.order('rating', { ascending: true });

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data || [];
}

export async function listReviewsByUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertReview({ userId, mediaType, mediaId, mediaTitle, mediaPoster, rating, body, hasSpoilers, notifyFriendIds = [] }) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      user_id: userId,
      media_type: mediaType,
      media_id: mediaId,
      media_title: mediaTitle,
      media_poster: mediaPoster,
      rating,
      body,
      has_spoilers: hasSpoilers,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,media_type,media_id' })
    .select()
    .single();
  if (error) throw error;

  if (notifyFriendIds.length) {
    await Promise.all(notifyFriendIds.map(fid =>
      createNotification({ userId: fid, actorId: userId, type: 'friend_review', data: { mediaTitle, mediaType, mediaId } }).catch(() => {})
    ));
  }
  return data;
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function toggleLike(reviewId, userId, currentlyLiked, reviewAuthorId, mediaTitle) {
  if (currentlyLiked) {
    const { error } = await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('review_likes').insert({ review_id: reviewId, user_id: userId });
  if (error) throw error;
  if (reviewAuthorId && reviewAuthorId !== userId) {
    createNotification({ userId: reviewAuthorId, actorId: userId, type: 'review_like', data: { mediaTitle } }).catch(() => {});
  }
  return true;
}

export async function getMyLikedReviewIds(userId, reviewIds) {
  if (!reviewIds.length) return new Set();
  const { data, error } = await supabase
    .from('review_likes')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds);
  if (error) throw error;
  return new Set((data || []).map(r => r.review_id));
}

export function computeReviewStats(reviews) {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + Number(r.rating), 0) / count : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
}
