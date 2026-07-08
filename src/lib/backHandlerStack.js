// Pila condivisa di gestori per "tornare indietro" — copre sia il tasto
// fisico Android (nativo, via Capacitor) sia il tasto/gesto Indietro del
// browser (web, o PWA installata): ogni volta che una schermata/modale a
// schermo intero si apre, aggiunge una voce alla cronologia del browser;
// quando l'utente torna indietro, chiudiamo solo la schermata più recente,
// rispettando l'ordine reale di apertura.
const stack = [];

// Quante chiusure "consumano" una voce di cronologia creata da noi stessi
// (es. l'utente ha toccato la X invece di premere Indietro): quando accade,
// dobbiamo rimuovere quella voce senza scambiarla per una vera pressione
// del tasto Indietro.
let suppressCount = 0;
let handlingGenuinePop = false;

export function pushBackHandler(fn) {
  stack.push(fn);
  try { window.history.pushState({ __backHandler: true }, ''); } catch (e) {}
}

export function popBackHandler(fn) {
  const i = stack.lastIndexOf(fn);
  if (i === -1) return;
  stack.splice(i, 1);
  if (!handlingGenuinePop) {
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
