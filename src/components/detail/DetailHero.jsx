import { useState } from 'react';
import { ChevronDown, MoreVertical, Trash2, Bookmark } from 'lucide-react';
import { IMG_BACKDROP } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function DetailHero({ backdropPath, title, subtitle, onClose, onRemove, onAddToList, favoriteSlot, showAddToList = true, showRemove = true, extraMenuItems }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative" style={{ height: 240, flexShrink: 0, background: 'var(--surface-alt)' }}>
      {backdropPath && (
        <img
          src={backdropPath.startsWith('http') ? backdropPath : `${IMG_BACKDROP}${backdropPath}`}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.85) 100%)' }} />

      <button
        onClick={onClose}
        aria-label={t('common.close')}
        className="btn-press absolute flex items-center justify-center"
        style={{ top: 14, left: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)' }}
      >
        <ChevronDown size={19} color="#fff" />
      </button>

      <div className="absolute flex items-center gap-2" style={{ top: 14, right: 14 }}>
        {favoriteSlot}
        {(showAddToList || showRemove || (extraMenuItems || []).length > 0) && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={t('header.moreActions')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="btn-press flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)' }}
          >
            <MoreVertical size={18} color="#fff" />
          </button>
        )}
        {menuOpen && (
          <div
            role="menu"
            className="fade-slide-down absolute right-0 mt-1 rounded-lg overflow-hidden z-10"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', minWidth: 190 }}
          >
            {showAddToList && (
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onAddToList(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 font-body text-sm text-left"
                style={{ color: 'var(--text)' }}
              >
                <Bookmark size={14} /> {t('showDetail.addToList')}
              </button>
            )}
            {(extraMenuItems || []).map((item) => (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => { setMenuOpen(false); item.onClick(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 font-body text-sm text-left"
                style={{ color: 'var(--text)' }}
              >
                <item.icon size={14} /> {item.label}
              </button>
            ))}
            {showRemove && (
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onRemove(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 font-body text-sm text-left"
                style={{ color: 'var(--tally)' }}
              >
                <Trash2 size={14} /> {t('showDetail.removeFromLibrary')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="absolute" style={{ left: 16, right: 16, bottom: 14 }}>
        <h1 className="font-display text-3xl leading-tight" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
