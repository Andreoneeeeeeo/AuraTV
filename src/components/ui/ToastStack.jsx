import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastList } from '../../contexts/ToastContext.jsx';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function ToastStack() {
  const { toasts, dismiss } = useToastList();

  return (
    <div
      className="fixed left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const colors = {
            success: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
            error: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
            info: { bg: 'var(--surface-raised)', text: 'var(--text)' },
          }[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="glass-strong pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl w-full"
              style={{ background: colors.bg, color: colors.text, maxWidth: 420, boxShadow: 'var(--shadow-md)' }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="font-body text-sm flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Chiudi notifica" className="flex-shrink-0">
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
