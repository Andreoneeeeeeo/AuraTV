// Pila condivisa di gestori per il tasto "Indietro" hardware (Android).
// Ogni schermata/modale a schermo intero registra la propria funzione di
// chiusura mentre è aperta; il tasto Indietro chiude sempre solo quella più
// in cima allo stack, rispettando l'ordine di navigazione reale.
const stack = [];

export function pushBackHandler(fn) {
  stack.push(fn);
}

export function popBackHandler(fn) {
  const i = stack.lastIndexOf(fn);
  if (i !== -1) stack.splice(i, 1);
}

export function triggerTopBackHandler() {
  if (stack.length === 0) return false;
  const fn = stack[stack.length - 1];
  fn();
  return true;
}
