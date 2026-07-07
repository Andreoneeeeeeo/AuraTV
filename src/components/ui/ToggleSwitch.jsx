export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="btn-press"
      style={{
        width: 42, height: 24, borderRadius: 12, flexShrink: 0, position: 'relative',
        background: checked ? 'var(--amber)' : 'var(--border)', transition: 'background 0.2s ease',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2, width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}
