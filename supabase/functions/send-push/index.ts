// Supabase Edge Function — invia una vera notifica push (arriva anche ad
// app chiusa) a tutti i dispositivi iscritti di un utente, rispettando le
// sue preferenze per categoria.
//
// Si distribuisce con:
//   supabase functions deploy send-push
// (istruzioni complete nel README).

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Etichette leggibili per ciascuna categoria (italiano, come il resto
// dell'app). Se in futuro aggiungi una lingua, questa funzione può
// accettare direttamente titolo/corpo già tradotti dal client invece di
// generarli qui — per ora teniamo tutto semplice e in italiano.
function buildMessage(type, actorName, data) {
  const name = actorName || 'Qualcuno';
  switch (type) {
    case 'friend_request': return { title: 'Nuova richiesta di amicizia', body: `${name} ti ha inviato una richiesta di amicizia.` };
    case 'friend_accept': return { title: 'Richiesta accettata', body: `${name} ha accettato la tua richiesta di amicizia.` };
    case 'new_follower': return { title: 'Nuovo follower', body: `${name} ha iniziato a seguirti.` };
    case 'friend_review': return { title: 'Nuova recensione', body: `${name} ha recensito ${data?.mediaTitle || 'un titolo'}.` };
    case 'review_like': return { title: 'Mi piace ricevuto', body: `A ${name} piace la tua recensione di ${data?.mediaTitle || 'un titolo'}.` };
    case 'review_comment': return { title: 'Nuovo commento', body: `${name} ha commentato la tua recensione di ${data?.mediaTitle || 'un titolo'}.` };
    case 'new_episode': return { title: 'Nuovo episodio disponibile', body: `${data?.mediaTitle || 'Una serie'} ha un nuovo episodio: ${data?.episodeTitle || ''}`.trim() };
    default: return { title: 'AuraTV', body: `${name} ha interagito con te.` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server non configurato: mancano VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY. Vedi il README.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  webpush.setVapidDetails('mailto:support@auratv.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, type, actorName, data } = await req.json();
    if (!userId || !type) {
      return new Response(JSON.stringify({ error: 'userId e type sono obbligatori.' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase.from('profiles').select('push_notification_prefs').eq('id', userId).maybeSingle();
    const prefs = profile?.push_notification_prefs || {};
    if (!prefs.enabled || prefs[type] === false) {
      return new Response(JSON.stringify({ ok: true, skipped: 'preferences' }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_subscriptions' }), {
        status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const message = buildMessage(type, actorName, data);
    const payload = JSON.stringify({ ...message, url: data?.url || './', tag: type });

    const results = await Promise.allSettled(subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ).catch(async (err) => {
        // Endpoint scaduto o non più valido: rimuoviamo l'iscrizione morta.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        throw err;
      })
    ));

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ ok: true, sent, total: subs.length }), {
      status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
