-- ============================================================================
-- TV TRACKER / AuraTV — Migrazione v11
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v10.
-- Salva la preferenza di visualizzazione (griglia o lista) della libreria
-- Serie, sincronizzata tra tutti i dispositivi come le altre impostazioni.
-- ============================================================================

alter table profiles add column if not exists library_view_mode text default 'grid';

-- ============================================================================
-- Fine migrazione v11.
-- ============================================================================
