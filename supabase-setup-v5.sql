-- ============================================================================
-- TV TRACKER — Migrazione v5
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v4.
-- Aggiunge lo stato "Abbandonato" tra quelli ammessi nella libreria pubblica.
-- ============================================================================

alter table public_library_items drop constraint if exists public_library_items_watch_status_check;
alter table public_library_items add constraint public_library_items_watch_status_check
  check (watch_status in ('watching', 'planned', 'on_hold', 'completed', 'dropped'));

-- ============================================================================
-- Fine migrazione v5.
-- ============================================================================
