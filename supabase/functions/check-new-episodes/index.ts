// Supabase Edge Function pianificata (via pg_cron, vedi supabase-setup-v13.sql)
// — gira una volta al giorno, controlla se una serie in libreria a QUALSIASI
// utente ha un nuovo episodio uscito oggi, e invia una notifica push a chi
// ce l'ha in libreria e ha quella categoria attiva.
//
// Si distribuisce con:
//   supabase functions deploy check-new-episodes
// (istruzioni complete nel README).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server non configurato: mancano variabili. Vedi il README.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = todayISO();

  try {
    // 1. Tutte le librerie di tutti gli utenti (una riga per utente, key='library')
    const { data: rows, error } = await supabase.from('app_data').select('user_id, value').eq('key', 'library');
    if (error) throw error;

    // 2. Per ogni serie, chi ce l'ha in libreria (deduplicando le serie da controllare su TMDB)
    const showToUsers = new Map(); // showId -> Set(userId)
    for (const row of rows || []) {
      let library;
      try { library = JSON.parse(row.value); } catch (e) { continue; }
      for (const showId of Object.keys(library || {})) {
        if (!showToUsers.has(showId)) showToUsers.set(showId, new Set());
        showToUsers.get(showId).add(row.user_id);
      }
    }

    let checked = 0, matched = 0, notified = 0;

    // 3. Per ogni serie unica, chiedi a TMDB se l'ultimo episodio è uscito oggi
    for (const [showId, userIds] of showToUsers.entries()) {
      checked++;
      let data;
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=${TMDB_API_KEY}&language=it-IT`);
        if (!res.ok) continue;
        data = await res.json();
      } catch (e) { continue; }

      const lastEp = data.last_episode_to_air;
      if (!lastEp || lastEp.air_date !== today) continue;
      matched++;

      // 4. Chi tra gli utenti con questa serie vuole essere avvisato?
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, push_notification_prefs')
        .in('id', Array.from(userIds));

      for (const profile of profiles || []) {
        const prefs = profile.push_notification_prefs || {};
        if (!prefs.enabled || prefs.new_episode === false) continue;

        await supabase.functions.invoke('send-push', {
          body: {
            userId: profile.id,
            type: 'new_episode',
            data: {
              mediaTitle: data.name,
              episodeTitle: `S${lastEp.season_number} E${lastEp.episode_number} — ${lastEp.name || ''}`.trim(),
            },
          },
        }).catch(() => {});
        notified++;
      }
    }

    return new Response(JSON.stringify({ ok: true, showsChecked: checked, showsWithNewEpisodeToday: matched, notificationsSent: notified }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
