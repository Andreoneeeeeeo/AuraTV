-- ============================================================================
-- TV TRACKER / AuraTV — Migrazione v10
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v9.
-- Salva quali categorie della libreria (Guardando, Da guardare, ecc.) sono
-- state chiuse dall'utente, così restano coerenti su tutti i dispositivi
-- esattamente come tema, lingua e colore accento.
-- ============================================================================

alter table profiles add column if not exists collapsed_library_sections jsonb default '{}'::jsonb;

-- ============================================================================
-- Fine migrazione v10.
-- ============================================================================
