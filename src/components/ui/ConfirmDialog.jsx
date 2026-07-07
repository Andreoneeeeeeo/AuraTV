export default function ConfirmDialog({ title, body, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: 'var(--overlay-strong)' }}
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="confirm-pop rounded-2xl p-5 w-full"
        style={{ background: 'var(--surface-raised)', maxWidth: 340, border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
      >
        <p id="confirm-dialog-title" className="font-display text-lg leading-tight mb-1">{title}</p>
        {body && <p className="font-body text-sm mb-5" style={{ color: 'var(--muted)' }}>{body}</p>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="btn-press px-4 py-2 rounded-full font-body text-sm font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            {cancelLabel}
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            className="btn-press px-4 py-2 rounded-full font-body text-sm font-bold"
            style={{ background: danger ? 'var(--tally)' : 'var(--amber)', color: danger ? '#fff' : 'var(--on-accent)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
