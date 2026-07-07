-- ============================================================================
-- TV TRACKER — Correzione bug "Seguire non funziona"
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase.
--
-- Causa: il vincolo che limita i valori ammessi nella colonna notifications.type
-- potrebbe non essere stato sostituito correttamente dalla migrazione v3
-- (dipende dal nome esatto assegnato da Postgres al vincolo originale).
-- Questo script trova ed elimina QUALSIASI vecchio vincolo su quella colonna,
-- prima di ricrearlo con tutti i tipi di notifica corretti — in modo sicuro
-- indipendentemente da come si chiamava prima.
-- ============================================================================

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
-- Fine. Prova di nuovo a seguire un utente: se il problema era questo,
-- ora funziona.
-- ============================================================================
