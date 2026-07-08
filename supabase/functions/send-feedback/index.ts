// Supabase Edge Function — invia a te (lo sviluppatore) via email quello
// che un utente scrive nel modulo "Impostazioni → Supporto" dell'app.
//
// A differenza di "tmdb-proxy", questa funzione RICHIEDE che chi la chiama
// sia un utente autenticato dell'app (niente --no-verify-jwt in fase di
// distribuzione), per evitare che chiunque la usi per spammarti la casella
// di posta.
//
// Si distribuisce con:
//   supabase functions deploy send-feedback
// (istruzioni complete nel README).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FEEDBACK_TO_EMAIL = Deno.env.get('FEEDBACK_TO_EMAIL');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!RESEND_API_KEY || !FEEDBACK_TO_EMAIL) {
    return new Response(
      JSON.stringify({ error: 'Il server non ha RESEND_API_KEY o FEEDBACK_TO_EMAIL configurati. Vedi il README.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { message, username, userEmail } = await req.json();

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Messaggio mancante.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const safeMessage = String(message).slice(0, 4000);
    const safeUsername = username ? String(username).slice(0, 100) : 'sconosciuto';
    const safeEmail = userEmail ? String(userEmail).slice(0, 200) : 'non disponibile';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AuraTV <onboarding@resend.dev>',
        to: [FEEDBACK_TO_EMAIL],
        reply_to: userEmail || undefined,
        subject: `[AuraTV] Segnalazione da ${safeUsername}`,
        text: `Da: ${safeUsername} (${safeEmail})\n\n${safeMessage}`,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      return new Response(JSON.stringify({ error: 'Invio email fallito', details: errBody }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
