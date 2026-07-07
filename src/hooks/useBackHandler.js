import { useEffect } from 'react';
import { pushBackHandler, popBackHandler } from '../lib/backHandlerStack.js';

// Registra onBack come "azione da compiere se l'utente preme Indietro"
// finché il componente che lo chiama resta montato (attivo = true).
export function useBackHandler(onBack, active = true) {
  useEffect(() => {
    if (!active) return;
    pushBackHandler(onBack);
    return () => popBackHandler(onBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
