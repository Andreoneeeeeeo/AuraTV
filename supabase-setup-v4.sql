-- ============================================================================
-- TV TRACKER — Migrazione v4
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v3.
-- Aggiunge: preferiti (film/serie) e una versione pubblica "leggera" della
-- libreria, così da poter mostrare le serie e i film di un utente sul suo
-- profilo pubblico — senza esporre i dati privati (episodi visti, note...).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PREFERITI
-- ---------------------------------------------------------------------------
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('show', 'film')),
  media_id bigint not null,
  media_title text,
  media_poster text,
  created_at timestamptz default now(),
  unique (user_id, media_type, media_id)
);

alter table favorites enable row level security;

drop policy if exists "Favorites are public" on favorites;
create policy "Favorites are public" on favorites for select using (true);

drop policy if exists "Users manage own favorites" on favorites;
create policy "Users manage own favorites" on favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own favorites" on favorites;
create policy "Users delete own favorites" on favorites for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. LIBRERIA PUBBLICA (solo titolo, poster e stato — non gli episodi visti)
-- ---------------------------------------------------------------------------
create table if not exists public_library_items (
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('show', 'film')),
  media_id bigint not null,
  media_title text,
  media_poster text,
  watch_status text not null default 'watching' check (watch_status in ('watching', 'planned', 'on_hold', 'completed', 'dropped')),
  updated_at timestamptz default now(),
  primary key (user_id, media_type, media_id)
);

alter table public_library_items enable row level security;

drop policy if exists "Public library items are public" on public_library_items;
create policy "Public library items are public" on public_library_items for select using (true);

drop policy if exists "Users manage own public library items" on public_library_items;
create policy "Users manage own public library items" on public_library_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own public library items" on public_library_items;
create policy "Users update own public library items" on public_library_items for update using (auth.uid() = user_id);

drop policy if exists "Users delete own public library items" on public_library_items;
create policy "Users delete own public library items" on public_library_items for delete using (auth.uid() = user_id);

-- ============================================================================
-- Fine migrazione v4.
-- ============================================================================
