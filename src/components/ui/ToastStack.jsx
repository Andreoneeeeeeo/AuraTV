import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastList } from '../../contexts/ToastContext.jsx';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function ToastStack() {
  const { toasts, dismiss } = useToastList();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        const colors = {
          success: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
          error: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
          info: { bg: 'var(--surface-raised)', text: 'var(--text)' },
        }[t.type];
        return (
          <div
            key={t.id}
            className="toast-in flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg w-full"
            style={{ background: colors.bg, color: colors.text, maxWidth: 420, border: '1px solid var(--border)' }}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span className="font-body text-sm flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Chiudi notifica" className="flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
