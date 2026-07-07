-- ============================================================================
-- TV TRACKER — Migrazione v7
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v6.
-- Aggiunge il supporto ai videogiochi: stessa architettura di recensioni,
-- preferiti e libreria pubblica già usata per serie/film, estesa alla
-- nuova categoria "game".
-- ============================================================================

-- Preferenza "traccio anche i videogiochi?" (null = non ancora chiesto)
alter table profiles add column if not exists tracks_games boolean;

-- Estende i vincoli media_type per includere 'game' ovunque già usato per show/film
alter table reviews drop constraint if exists reviews_media_type_check;
alter table reviews add constraint reviews_media_type_check check (media_type in ('show', 'film', 'game'));

alter table favorites drop constraint if exists favorites_media_type_check;
alter table favorites add constraint favorites_media_type_check check (media_type in ('show', 'film', 'game'));

alter table public_library_items drop constraint if exists public_library_items_media_type_check;
alter table public_library_items add constraint public_library_items_media_type_check check (media_type in ('show', 'film', 'game'));

-- ============================================================================
-- Fine migrazione v7.
-- ============================================================================
