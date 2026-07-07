-- ============================================================================
-- TV TRACKER — Migrazione v6
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v5.
-- Aggiunge: liste pubbliche condivisibili con URL dedicato, colore accento
-- e dimensione testo personalizzabili.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. LISTE PUBBLICHE (condivisibili tramite link)
-- ---------------------------------------------------------------------------
create table if not exists public_lists (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  tags jsonb default '[]'::jsonb,
  items jsonb default '[]'::jsonb,
  cover_poster text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public_lists enable row level security;

drop policy if exists "Public lists are public" on public_lists;
create policy "Public lists are public" on public_lists for select using (true);

drop policy if exists "Users manage own public lists" on public_lists;
create policy "Users manage own public lists" on public_lists for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own public lists" on public_lists;
create policy "Users update own public lists" on public_lists for update using (auth.uid() = user_id);

drop policy if exists "Users delete own public lists" on public_lists;
create policy "Users delete own public lists" on public_lists for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. PERSONALIZZAZIONE (colore accento, dimensione testo)
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists accent_color text default '#F5C518';
alter table profiles add column if not exists text_size text default 'medium' check (text_size in ('small', 'medium', 'large'));

-- ============================================================================
-- Fine migrazione v6.
-- ============================================================================
