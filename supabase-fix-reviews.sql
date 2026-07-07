-- ============================================================================
-- TV TRACKER — Correzione bug "le recensioni non si vedono"
-- Esegui questo script UNA VOLTA nel SQL Editor di Supabase.
--
-- Causa del problema: le colonne reviews.user_id e notifications.actor_id
-- puntavano alla tabella interna auth.users. Supabase però, per poter
-- "unire" automaticamente ogni recensione/notifica al profilo di chi l'ha
-- scritta (nome utente, foto), ha bisogno che la colonna punti alla tabella
-- pubblica profiles. Con il collegamento sbagliato, la richiesta che elenca
-- le recensioni falliva silenziosamente: per questo si potevano scrivere
-- recensioni (l'inserimento non aveva bisogno di quel collegamento) ma non
-- vederle (l'elenco sì).
-- ============================================================================

alter table reviews drop constraint if exists reviews_user_id_fkey;
alter table reviews add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table notifications drop constraint if exists notifications_actor_id_fkey;
alter table notifications add constraint notifications_actor_id_fkey
  foreign key (actor_id) references public.profiles(id) on delete set null;

-- Fine. Le recensioni già scritte in precedenza non sono andate perse:
-- da ora in poi torneranno visibili normalmente.
