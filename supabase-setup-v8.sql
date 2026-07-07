-- ============================================================================
-- TV TRACKER — Migrazione v8
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v7.
-- Aggiunge: personaggio preferito per ogni film/serie, e banner personalizzati
-- (sincronizzati fra tutti i dispositivi dell'utente).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PERSONAGGIO PREFERITO
-- ---------------------------------------------------------------------------
create table if not exists favorite_characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('show', 'film', 'game')),
  media_id bigint not null,
  character_name text,
  actor_name text,
  profile_path text,
  created_at timestamptz default now(),
  unique (user_id, media_type, media_id)
);

alter table favorite_characters enable row level security;

drop policy if exists "Favorite characters are public" on favorite_characters;
create policy "Favorite characters are public" on favorite_characters for select using (true);

drop policy if exists "Users manage own favorite characters" on favorite_characters;
create policy "Users manage own favorite characters" on favorite_characters for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own favorite characters" on favorite_characters;
create policy "Users update own favorite characters" on favorite_characters for update using (auth.uid() = user_id);

drop policy if exists "Users delete own favorite characters" on favorite_characters;
create policy "Users delete own favorite characters" on favorite_characters for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. BANNER PERSONALIZZATI
-- ---------------------------------------------------------------------------
create table if not exists custom_banners (
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('show', 'film', 'game')),
  media_id bigint not null,
  banner_url text not null,
  source text not null default 'custom' check (source in ('tmdb_backdrop', 'custom_upload')),
  updated_at timestamptz default now(),
  primary key (user_id, media_type, media_id)
);

alter table custom_banners enable row level security;

drop policy if exists "Custom banners are public" on custom_banners;
create policy "Custom banners are public" on custom_banners for select using (true);

drop policy if exists "Users manage own custom banners" on custom_banners;
create policy "Users manage own custom banners" on custom_banners for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own custom banners" on custom_banners;
create policy "Users update own custom banners" on custom_banners for update using (auth.uid() = user_id);

drop policy if exists "Users delete own custom banners" on custom_banners;
create policy "Users delete own custom banners" on custom_banners for delete using (auth.uid() = user_id);

-- Spazio di archiviazione per i banner caricati manualmente dall'utente
insert into storage.buckets (id, name, public)
values ('custom-banners', 'custom-banners', true)
on conflict (id) do nothing;

drop policy if exists "Custom banner images are publicly accessible" on storage.objects;
create policy "Custom banner images are publicly accessible" on storage.objects
  for select using (bucket_id = 'custom-banners');

drop policy if exists "Users upload their own custom banners" on storage.objects;
create policy "Users upload their own custom banners" on storage.objects
  for insert with check (bucket_id = 'custom-banners' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users update their own custom banners" on storage.objects;
create policy "Users update their own custom banners" on storage.objects
  for update using (bucket_id = 'custom-banners' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete their own custom banners" on storage.objects;
create policy "Users delete their own custom banners" on storage.objects
  for delete using (bucket_id = 'custom-banners' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- Fine migrazione v8.
-- ============================================================================
