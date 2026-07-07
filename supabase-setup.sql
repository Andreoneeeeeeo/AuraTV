-- Esegui questo script UNA VOLTA sola nel SQL Editor del tuo progetto Supabase
-- (Supabase.com -> il tuo progetto -> SQL Editor -> New query -> incolla -> Run)

-- Tabella unica in stile "chiave-valore" per utente: qui vivono libreria serie,
-- libreria film, liste e chiave API TMDB di ognuno.
create table if not exists app_data (
  user_id uuid references auth.users on delete cascade not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- Abilita la sicurezza a livello di riga: senza questo, chiunque potrebbe
-- leggere i dati di chiunque altro.
alter table app_data enable row level security;

-- Ogni utente può leggere, scrivere, modificare ed eliminare SOLO le proprie righe.
create policy "Users manage their own data"
  on app_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
