-- ============================================================================
-- TV TRACKER — Migrazione v3
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v2.
-- Aggiunge: sistema "segui" (asimmetrico, senza richiesta di conferma),
-- commenti alle recensioni, nuovi tipi di notifica.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FOLLOW (seguire un utente, senza bisogno di conferma)
-- Diverso dal sistema "Amici" già esistente (che resta invariato e continua
-- a funzionare): qui non serve accettazione, come su Letterboxd/Trakt.
-- ---------------------------------------------------------------------------
create table if not exists follows (
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

alter table follows enable row level security;

drop policy if exists "Follows are public" on follows;
create policy "Follows are public" on follows for select using (true);

drop policy if exists "Users follow as themselves" on follows;
create policy "Users follow as themselves" on follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Users unfollow themselves" on follows;
create policy "Users unfollow themselves" on follows for delete using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- 2. COMMENTI ALLE RECENSIONI
-- ---------------------------------------------------------------------------
create table if not exists review_comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

alter table review_comments enable row level security;

drop policy if exists "Comments are public" on review_comments;
create policy "Comments are public" on review_comments for select using (true);

drop policy if exists "Users insert own comments" on review_comments;
create policy "Users insert own comments" on review_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own comments" on review_comments;
create policy "Users delete own comments" on review_comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. NUOVI TIPI DI NOTIFICA (nuovo follower, nuovo commento)
-- Il blocco DO trova ed elimina qualsiasi vincolo esistente sulla colonna
-- "type", indipendentemente dal nome, per evitare che resti attivo un
-- vecchio vincolo che blocca i nuovi valori.
-- ---------------------------------------------------------------------------
do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table notifications drop constraint %I', cons.conname);
  end loop;
end $$;

alter table notifications add constraint notifications_type_check
  check (type in ('friend_request', 'friend_accept', 'review_like', 'friend_review', 'new_follower', 'review_comment'));

-- ============================================================================
-- Fine migrazione v3.
-- ============================================================================
