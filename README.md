# AuraTV — build multipiattaforma

Questo progetto trasforma l'app AuraTV in applicazioni installabili per **Windows**, **Android** e **iPhone**, tutte generate automaticamente e gratuitamente tramite GitHub Actions (non serve un Mac, non serve pagare nulla).

> **Account e dati condivisi**: l'app richiede login (email + password). I dati di ogni persona (serie, film, liste, profilo, recensioni, amici) sono salvati in un database Supabase gratuito che tu controlli, e si sincronizzano automaticamente su tutti i dispositivi di quella persona. Ogni utente vede solo i propri dati privati; profili e recensioni sono pubblici tra gli utenti dell'app, come in TvTime.

## Novità di questa versione

- 🌍 **Lingua**: scelta Italiano/Inglese al primo avvio, cambiabile in ogni momento dalle impostazioni. Nessun testo è più scritto "a mano" nel codice.
- 🎨 **Tema chiaro / scuro / automatico**, applicato ovunque tramite variabili CSS.
- 👤 **Profilo personale**: foto, banner, nome utente, nome visualizzato, biografia.
- 🤝 **Amici**: ricerca utenti per nome utente, richieste, accettazione/rifiuto, rimozione.
- ⭐ **Recensioni**: voto a stelle (mezze stelle, 0,5–5), testo, spoiler nascosti, "mi piace", ordinamento, statistiche personali e di community su ogni serie/film.
- 🔔 **Notifiche**: richieste di amicizia, "mi piace" alle recensioni, nuove recensioni di amici — con preferenze attivabili/disattivabili.
- ⚙️ **Impostazioni riorganizzate**: Account, Profilo, Aspetto, Lingua, Notifiche, Privacy, Sicurezza, Dati, Informazioni, Supporto.
- 🧱 **Codice riorganizzato** in moduli (componenti, hook, librerie) invece di un unico file da 1750 righe, con caricamento "pigro" (code-splitting) delle schermate meno usate per un avvio più veloce.
- ♿ **Accessibilità**: focus visibili da tastiera, etichette per screen reader, aree di tocco più ampie, zoom della pagina non più bloccato.
- 📱 **Responsive vero**: su schermi larghi (tablet/desktop, incluso il programma Windows) compare una barra laterale al posto della barra in basso, e le griglie mostrano più colonne.

---

## 0. Configura Supabase (una volta sola, prima di tutto)

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito
2. Crea un nuovo progetto (scegli una password del database qualsiasi, non ti servirà direttamente)
3. Aspetta che il progetto finisca di provisionare (1-2 minuti)
4. Vai su **SQL Editor** (icona nel menu laterale) → **New query**
5. Apri il file `supabase-setup.sql` incluso in questo progetto, copia tutto il contenuto, incollalo nell'editor SQL di Supabase
6. Clicca **Run** — questo crea la tabella dati e le regole di sicurezza (ogni utente vede solo i propri dati)
7. Apri una **New query** e ripeti lo stesso con il file `supabase-setup-v2.sql`: crea profili, amici, recensioni, notifiche e lo spazio per foto profilo/banner
8. Vai su **Project Settings** (icona ingranaggio) → **API**
9. Copia il **Project URL** e la chiave **anon public**
10. Apri il file `src/lib/supabaseConfig.js` in questo progetto e incolla i due valori al posto di `IL-TUO-PROGETTO.supabase.co` e `LA-TUA-ANON-KEY`
11. Salva il file — è pronto per essere caricato su GitHub insieme al resto

Il piano gratuito di Supabase è più che sufficiente per un gruppo di amici: 500MB di spazio, fino a 50.000 utenti attivi al mese.

> Se avevi già eseguito `supabase-setup.sql` in passato ed hai già utenti registrati, `supabase-setup-v2.sql` crea automaticamente un profilo (nome utente generato) anche per loro: nessuno resta escluso.

### Email di conferma (facoltativo ma consigliato disattivarla per un gruppo di amici)

Di default Supabase invia un'email di conferma quando qualcuno si registra. Per un piccolo gruppo puoi disattivarla così i tuoi amici possono accedere subito dopo la registrazione:

1. Su Supabase, vai su **Authentication** → **Providers** → **Email**
2. Disattiva **Confirm email**
3. Salva

---

## 0.1 Nascondi la chiave TMDB (una volta sola)

L'app non chiede più a ciascun utente di inserire una propria chiave TMDB: tutte le richieste passano da una piccola funzione server ("Edge Function") che gira dentro il tuo stesso progetto Supabase, dove la chiave vera resta nascosta e non finisce mai nel codice pubblico su GitHub.

Questa parte richiede il terminale del computer (non basta il browser), ma sono comandi da incollare, nessuna programmazione.

**Cosa ti serve prima:**
- [Node.js](https://nodejs.org) già installato (se hai seguito questa guida per le build, probabilmente ce l'hai già)
- Una chiave API TMDB gratuita: vai su [themoviedb.org](https://www.themoviedb.org) → crea un account → **Impostazioni** → **API** → richiedi una chiave per uso "Developer" → copia la **"API Key (v3 auth)"**

**Passaggi (dal terminale, dentro la cartella del progetto):**

1. Installa la Supabase CLI (una volta sola sul tuo computer):
   ```
   npm install -g supabase
   ```
2. Accedi al tuo account Supabase (si apre il browser per il login):
   ```
   supabase login
   ```
3. Collega il progetto (dalla cartella di questo progetto, dove c'è già la cartella `supabase/`):
   ```
   supabase link --project-ref fmsduelqycnhcoawmtkp
   ```
   (`fmsduelqycnhcoawmtkp` è l'identificativo del tuo progetto Supabase — lo trovi anche nell'URL del progetto, es. `https://supabase.com/dashboard/project/fmsduelqycnhcoawmtkp`. Se in futuro cambi progetto Supabase, usa il nuovo identificativo qui.)
4. Salva la tua chiave TMDB come segreto del server (**sostituisci** `LA-TUA-CHIAVE-TMDB` con quella vera):
   ```
   supabase secrets set TMDB_API_KEY=LA-TUA-CHIAVE-TMDB
   ```
5. Distribuisci la funzione:
   ```
   supabase functions deploy tmdb-proxy --no-verify-jwt
   ```

Fatto! Da ora l'app userà sempre questa funzione, senza che nessun utente debba inserire alcuna chiave. Se in futuro modifichi il file `supabase/functions/tmdb-proxy/index.ts`, ripeti solo il passaggio 5 per aggiornare la funzione online.

> `--no-verify-jwt` serve perché questa funzione è pensata per essere chiamata pubblicamente (come TMDB stesso, i cui dati sono comunque pubblici); non espone nulla di privato — la sicurezza dei dati personali resta quella data dalle regole RLS del database, non da questa funzione.

---

## 0.2 Ricevi via email le segnalazioni degli utenti (facoltativo)

In Impostazioni → Supporto, gli utenti possono scriverti un messaggio che arriva direttamente alla tua email, tramite **Resend** (gratuito, 3.000 email/mese, nessuna carta di credito richiesta).

1. Crea un account gratuito su [resend.com](https://resend.com)
2. Vai su **API Keys** → **Create API Key** → copia la chiave (inizia con `re_`)
3. Nella cartella del progetto, dal terminale (dopo aver già fatto `supabase login` e `supabase link` come sopra):
   ```
   supabase secrets set RESEND_API_KEY=LA-TUA-CHIAVE-RESEND
   supabase secrets set FEEDBACK_TO_EMAIL=tua-email@esempio.com
   ```
   (`FEEDBACK_TO_EMAIL` è l'indirizzo a cui vuoi ricevere le segnalazioni — di solito la stessa email con cui ti sei registrato su Resend)
4. Distribuisci la funzione:
   ```
   supabase functions deploy send-feedback
   ```

Da ora ogni messaggio scritto nel modulo di supporto ti arriverà via email. Nessuna configurazione ulteriore lato utente: la funzione richiede solo che chi scrive sia un utente già loggato nell'app, per evitare spam.

> Non serve verificare un dominio: le email vengono inviate dall'indirizzo di test di Resend (`onboarding@resend.dev`) esclusivamente verso la tua casella — è l'unico uso consentito senza verifica, e coincide esattamente con questo caso d'uso.

---

## 1. Metti il progetto su GitHub (una volta sola)

1. Crea un account gratuito su [github.com](https://github.com) se non ce l'hai già
2. Crea un nuovo repository (può essere privato), es. `tv-tracker-app`
3. Carica tutti i file di questo progetto nel repository:
   - Più semplice: sulla pagina del repository vuoto, usa "uploading an existing file" e trascina dentro tutta la cartella
   - Alternativa (se usi git): 
     ```
     git init
     git add .
     git commit -m "prima versione"
     git branch -M main
     git remote add origin https://github.com/TUO-USERNAME/tv-tracker-app.git
     git push -u origin main
     ```

---

## 2. Genera le build

Nel tuo repository su GitHub, vai sulla tab **Actions**. Se richiesto, abilita i workflow (pulsante verde "I understand my workflows, go ahead and enable them").

Vedrai tre workflow: **Build Windows App**, **Build Android APK**, **Build iOS IPA**. Per ognuno:

1. Clicca sul nome del workflow
2. Clicca **Run workflow** (in alto a destra) → **Run workflow** di conferma
3. Aspetta che finisca (icona verde ✓). Ci vogliono di solito 5-15 minuti
4. Clicca sulla build completata, scorri in fondo alla pagina fino a **Artifacts**, e scarica lo zip

---

## 3. Installare su Windows

1. Scarica ed estrai `TVTracker-windows.zip` dall'Artifact della build Windows
2. Dentro trovi un file `.exe` (es. `AuraTV Setup 1.0.0.exe`)
3. Eseguilo. Windows potrebbe mostrare un avviso SmartScreen ("Windows ha protetto il tuo PC") perché l'app non è firmata con un certificato a pagamento — clicca **Ulteriori informazioni** → **Esegui comunque**
4. Segui l'installazione, poi apri l'app dal menu Start

---

## 4. Installare su Android

1. Scarica `TVTracker-android.zip` dall'Artifact della build Android ed estrai `app-debug.apk`
2. Trasferisci il file `.apk` sul telefono Android (email a te stesso, Google Drive, cavo USB, ecc.)
3. Sul telefono, apri il file `.apk` dal gestore file
4. Se richiesto, consenti "Installa da fonti sconosciute" per l'app che stai usando per aprirlo (impostazione una tantum)
5. Installa e apri l'app

---

## 5. Installare su iPhone (con Sideloadly, gratis)

Su iPhone Apple non permette di installare app fuori dall'App Store senza qualche passaggio in più. Ecco la via gratuita:

### Cosa ti serve
- Un PC Windows (o Mac)
- Un cavo USB per collegare l'iPhone
- Un **Apple ID gratuito** (quello che usi già per iCloud va benissimo)
- [Sideloadly](https://sideloadly.io) scaricato e installato
- [iTunes](https://www.apple.com/itunes/) installato sul PC (Sideloadly ne ha bisogno per riconoscere l'iPhone)

### Passaggi

1. Scarica `TVTracker-ios.zip` dall'Artifact della build iOS ed estrai `TVTracker.ipa`
2. Collega l'iPhone al PC via USB, sblocca il telefono e conferma "Autorizza questo computer" se richiesto
3. Apri Sideloadly
4. Trascina `TVTracker.ipa` nella finestra di Sideloadly
5. Inserisci il tuo Apple ID e password nei campi richiesti (Sideloadly li usa solo per firmare l'app con Apple, non li salva altrove)
6. Clicca **Start**
7. Sul PC potrebbe aprirsi una richiesta di codice di verifica in due passaggi: inseriscilo se richiesto
8. Al termine, l'icona "AuraTV" apparirà sulla home dell'iPhone

### Per farla funzionare la prima volta

Su iPhone vai su **Impostazioni → Generali → VPN e gestione dispositivo**, trova il tuo Apple ID sotto "App per sviluppatori" e tocca **Fidati**.

### Il limite da sapere

Con un Apple ID gratuito, l'app smette di funzionare dopo **7 giorni** (limite imposto da Apple, non aggirabile senza pagare 99$/anno per il vero account sviluppatore). Per rinnovarla:

1. Ricollega l'iPhone al PC
2. Riapri Sideloadly
3. Trascina di nuovo lo stesso file `TVTracker.ipa` (non serve rifare la build su GitHub)
4. Clicca Start di nuovo

Bastano 2 minuti ogni settimana.

---

## Struttura del progetto

Il codice è organizzato per funzionalità, così è facile trovare cosa modificare:

```
src/
├── App.jsx                 punto di ingresso dell'app dopo il login
├── main.jsx                provider globali, onboarding lingua, autenticazione
├── index.css                variabili di tema, animazioni, stili base
├── i18n/                    sistema di traduzione (it.js, en.js)
├── theme/                   tema chiaro/scuro/automatico
├── contexts/                stato globale (autenticazione, notifiche toast)
├── hooks/                   logica di persistenza dati (useLibraryData)
├── lib/                     funzioni verso Supabase e TMDB, formattazione, CSV
└── components/
    ├── auth/                login, registrazione, recupero password
    ├── onboarding/          scelta lingua al primo avvio
    ├── layout/              intestazione, barra di navigazione mobile/desktop
    ├── tabs/                Palinsesto, Libreria, Scopri, Statistiche
    ├── show/, film/          schede di dettaglio serie e film
    ├── reviews/              stelle, form recensione, lista recensioni
    ├── profile/              pagina profilo e modifica profilo
    ├── friends/              ricerca e gestione amici
    ├── notifications/        campanella e pannello notifiche
    ├── settings/             pagina impostazioni e sue sezioni
    ├── ui/                   componenti generici riutilizzabili (toast, avatar, toggle...)
    └── shared/               componenti condivisi tra le schermate (poster, stati vuoti...)
```

Per aggiungere una lingua: crea `src/i18n/locales/xx.js` copiando `en.js`, poi aggiungilo a `LOCALES` in `src/i18n/index.jsx`.

---

## Se qualcosa va storto


- **La build Android fallisce**: a volte serve rilanciarla una seconda volta (i runner gratuiti di GitHub a volte hanno intoppi temporanei con Gradle)
- **La build iOS fallisce su CocoaPods**: rilancia il workflow; se persiste, fammi vedere il log d'errore
- **Sideloadly non trova l'iPhone**: assicurati che iTunes sia installato e che l'iPhone sia sbloccato e "autorizzato" per quel computer

Per qualunque errore, copia il messaggio (o uno screenshot del log su GitHub Actions) e mandamelo: lo leggo e ti dico cosa sistemare.
