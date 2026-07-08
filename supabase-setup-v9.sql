-- ============================================================================
-- TV TRACKER / AuraTV — Migrazione v9
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v8.
-- Aggiunge al profilo le preferenze che finora restavano legate al singolo
-- dispositivo (colore accento, dimensione testo, pausa automatica delle
-- serie), così che si sincronizzino su tutti i dispositivi dell'utente
-- proprio come già succede per tema e lingua.
-- ============================================================================

alter table profiles add column if not exists accent_color text default 'amber';
alter table profiles add column if not exists text_size text default 'normal';
alter table profiles add column if not exists auto_pause_months integer default 0;

-- ============================================================================
-- Fine migrazione v9.
-- ============================================================================
