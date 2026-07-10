// Pila condivisa di gestori per "tornare indietro" — copre sia il tasto
// fisico Android (nativo, via Capacitor) sia il tasto/gesto Indietro del
// browser (web, o PWA installata): ogni volta che una schermata/modale a
// schermo intero si apre, aggiunge una voce alla cronologia del browser;
// quando l'utente torna indietro, chiudiamo solo la schermata più recente,
// rispettando l'ordine reale di apertura.
//
// Il gestore "di base" della shell principale dell'app (vedi App.jsx) è un
// caso speciale: resta montato per tutta la sessione e NON deve consumare
// una voce di cronologia quando si smonta per una normale navigazione tra
// pagine (es. verso un profilo pubblico) — altrimenti quella navigazione
// verrebbe annullata subito dopo. Per questo pushBackHandler/popBackHandler
// accettano un secondo parametro "trackHistory" che App.jsx imposta a false.
const stack = [];

// Quante chiusure "consumano" una voce di cronologia creata da noi stessi
// (es. l'utente ha toccato la X invece di premere Indietro): quando accade,
// dobbiamo rimuovere quella voce senza scambiarla per una vera pressione
// del tasto Indietro.
let suppressCount = 0;
let handlingGenuinePop = false;

export function pushBackHandler(fn, trackHistory = true) {
  stack.push(fn);
  if (trackHistory) {
    try { window.history.pushState({ __backHandler: true }, ''); } catch (e) {}
  }
}

export function popBackHandler(fn, trackHistory = true) {
  const i = stack.lastIndexOf(fn);
  if (i === -1) return;
  stack.splice(i, 1);
  if (trackHistory && !handlingGenuinePop) {
    // Chiusura avviata dall'interfaccia (es. tap sulla X), non dal tasto
    // Indietro: consumiamo noi la voce di cronologia che avevamo creato,
    // così cronologia e stack restano sempre allineati.
    suppressCount += 1;
    try { window.history.back(); } catch (e) {}
  }
}

export function triggerTopBackHandler() {
  if (stack.length === 0) return false;
  const fn = stack[stack.length - 1];
  fn();
  return true;
}

// Da collegare all'evento "popstate" del browser (tasto/gesto Indietro).
export function handleGlobalPopState() {
  if (suppressCount > 0) {
    suppressCount -= 1;
    return;
  }
  handlingGenuinePop = true;
  triggerTopBackHandler();
  Promise.resolve().then(() => { handlingGenuinePop = false; });
}
