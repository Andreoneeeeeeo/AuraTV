-- ============================================================================
-- TV TRACKER / AuraTV — Migrazione v13
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase, dopo v12.
-- Pianifica un controllo automatico giornaliero (l'"orologio" di cui
-- parlavamo) che avvisa gli utenti quando esce un nuovo episodio di una
-- serie che hanno in libreria.
-- ============================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- IMPORTANTE: prima di eseguire, sostituisci qui sotto
-- "INCOLLA-QUI-LA-TUA-SERVICE-ROLE-KEY" con la tua vera Service Role Key.
-- La trovi in Supabase → Project Settings → API → "service_role" (non è la
-- stessa cosa della "anon" key: serve quella con più permessi). È un
-- segreto: non condividerla e non incollarla da nessun'altra parte.
select cron.schedule(
  'auratv-check-new-episodes-daily',
  '0 8 * * *', -- ogni giorno alle 8:00 UTC (le 9:00/10:00 in Italia a seconda dell'ora legale)
  $$
  select net.http_post(
    url := 'https://fmsduelqycnhcoawmtkp.supabase.co/functions/v1/check-new-episodes',
    headers := jsonb_build_object(
      'Authorization', 'Bearer INCOLLA-QUI-LA-TUA-SERVICE-ROLE-KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Per verificare che sia stato programmato correttamente:
--   select * from cron.job;
-- Per rimuoverlo in futuro, se vuoi:
--   select cron.unschedule('auratv-check-new-episodes-daily');

-- ============================================================================
-- Fine migrazione v13.
-- ============================================================================
