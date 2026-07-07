-- ============================================================================
-- TV TRACKER — Migrazione v2
-- Esegui questo script UNA VOLTA nel SQL Editor del tuo progetto Supabase,
-- DOPO aver già eseguito supabase-setup.sql.
-- Aggiunge: profili utente, sistema amici, recensioni, notifiche, storage.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILI UTENTE
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  bio text default '',
  avatar_url text,
  banner_url text,
  language text default 'it',
  theme text default 'dark',
  privacy jsonb default '{"visibility":"public","show_activity":true}'::jsonb,
  notification_prefs jsonb default '{"friend_requests":true,"review_likes":true,"friend_activity":true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Crea automaticamente un profilo alla registrazione di un nuovo utente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Se avevi già utenti prima di questa migrazione, crea i profili mancanti
insert into public.profiles (id, username, display_name)
select u.id, 'user_' || substr(replace(u.id::text, '-', ''), 1, 8), split_part(u.email, '@', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ---------------------------------------------------------------------------
-- 2. SISTEMA AMICI
-- ---------------------------------------------------------------------------
create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users on delete cascade not null,
  addressee_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint no_self_friend check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table friendships enable row level security;

drop policy if exists "Users see their friendships" on friendships;
create policy "Users see their friendships" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users create requests" on friendships;
create policy "Users create requests" on friendships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "Users update their friendships" on friendships;
create policy "Users update their friendships" on friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users delete their friendships" on friendships;
create policy "Users delete their friendships" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ---------------------------------------------------------------------------
-- 3. RECENSIONI
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('show', 'film')),
  media_id bigint not null,
  media_title text,
  media_poster text,
  rating numeric(3,1) not null check (rating >= 0.5 and rating <= 5),
  body text default '',
  has_spoilers boolean default false,
  likes_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, media_type, media_id)
);

alter table reviews enable row level security;

drop policy if exists "Reviews are public" on reviews;
create policy "Reviews are public" on reviews for select using (true);

drop policy if exists "Users insert own reviews" on reviews;
create policy "Users insert own reviews" on reviews for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own reviews" on reviews;
create policy "Users update own reviews" on reviews for update using (auth.uid() = user_id);

drop policy if exists "Users delete own reviews" on reviews;
create policy "Users delete own reviews" on reviews for delete using (auth.uid() = user_id);

-- "Mi piace" alle recensioni
create table if not exists review_likes (
  review_id uuid references reviews on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  primary key (review_id, user_id)
);

alter table review_likes enable row level security;

drop policy if exists "Likes are public" on review_likes;
create policy "Likes are public" on review_likes for select using (true);

drop policy if exists "Users manage own likes" on review_likes;
create policy "Users manage own likes" on review_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own likes" on review_likes;
create policy "Users delete own likes" on review_likes for delete using (auth.uid() = user_id);

-- Mantiene aggiornato likes_count automaticamente
create or replace function public.increment_review_likes()
returns trigger as $$
begin
  update reviews set likes_count = likes_count + 1 where id = new.review_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_review_like_insert on review_likes;
create trigger on_review_like_insert
  after insert on review_likes
  for each row execute procedure public.increment_review_likes();

create or replace function public.decrement_review_likes()
returns trigger as $$
begin
  update reviews set likes_count = greatest(0, likes_count - 1) where id = old.review_id;
  return old;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_review_like_delete on review_likes;
create trigger on_review_like_delete
  after delete on review_likes
  for each row execute procedure public.decrement_review_likes();

-- ---------------------------------------------------------------------------
-- 4. NOTIFICHE
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('friend_request', 'friend_accept', 'review_like', 'friend_review')),
  data jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

drop policy if exists "Users delete own notifications" on notifications;
create policy "Users delete own notifications" on notifications for delete using (auth.uid() = user_id);

-- Chi compie l'azione (actor) può creare una notifica per un altro utente
drop policy if exists "Actor can create notification" on notifications;
create policy "Actor can create notification" on notifications
  for insert with check (auth.uid() = actor_id);

-- Abilita le notifiche realtime (facoltativo ma consigliato). Il blocco DO
-- evita errori se lo script viene eseguito più di una volta.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. STORAGE: avatar e banner
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Banner images are publicly accessible" on storage.objects;
create policy "Banner images are publicly accessible" on storage.objects
  for select using (bucket_id = 'banners');

drop policy if exists "Users upload their own banner" on storage.objects;
create policy "Users upload their own banner" on storage.objects
  for insert with check (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users update their own banner" on storage.objects;
create policy "Users update their own banner" on storage.objects
  for update using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete their own banner" on storage.objects;
create policy "Users delete their own banner" on storage.objects
  for delete using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- Fine migrazione. La tua app TV Tracker ora supporta profili, amici,
-- recensioni e notifiche.
-- ============================================================================
