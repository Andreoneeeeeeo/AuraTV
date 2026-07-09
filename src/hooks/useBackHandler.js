import { useEffect } from 'react';
import { pushBackHandler, popBackHandler } from '../lib/backHandlerStack.js';

// Registra onBack come "azione da compiere se l'utente preme Indietro"
// finché il componente che lo chiama resta montato (attivo = true).
//
// trackHistory=true (default) è per finestre/modali vere e proprie: alla
// loro apertura si aggiunge una voce alla cronologia del browser, così sia
// il tasto Indietro sia la chiusura da interfaccia restano coerenti tra
// loro. Va messo a false solo per un gestore "di base" e permanente (vedi
// App.jsx), che non rappresenta una schermata "apribile/chiudibile" ma va
// comunque interpellato quando nessun altro gestore è attivo.
export function useBackHandler(onBack, active = true, trackHistory = true) {
  useEffect(() => {
    if (!active) return;
    pushBackHandler(onBack, trackHistory);
    return () => popBackHandler(onBack, trackHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
