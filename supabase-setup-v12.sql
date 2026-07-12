-- ============================================================================
-- TV TRACKER / AuraTV — Migrazione v12
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v11.
-- Aggiunge le notifiche push vere (che arrivano anche ad app chiusa):
--   - una tabella per i dispositivi iscritti alle notifiche
--   - le preferenze granulari per categoria sul profilo
-- ============================================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- La Edge Function che invia le notifiche usa la service role key, che
-- ignora comunque le regole RLS — nessuna policy aggiuntiva necessaria per lei.

alter table profiles add column if not exists push_notification_prefs jsonb default '{
  "enabled": false,
  "friend_request": true,
  "friend_accept": true,
  "new_follower": true,
  "friend_review": true,
  "review_like": true,
  "review_comment": true,
  "new_episode": true
}'::jsonb;

-- ============================================================================
-- Fine migrazione v12.
-- ============================================================================
