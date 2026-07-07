import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MoreVertical, Trash2, Bookmark } from 'lucide-react';
import { IMG_BACKDROP } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function DetailHero({
  backdropPath, title, subtitle, onClose, onRemove, onAddToList, favoriteSlot,
  showAddToList = true, showRemove = true, extraMenuItems, scrollY = 0,
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const clampedScroll = Math.max(0, Math.min(scrollY, 260));

  return (
    <div className="relative overflow-hidden" style={{ height: 260, flexShrink: 0, background: 'var(--surface-alt)' }}>
      {backdropPath && (
        <motion.img
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 + clampedScroll / 1400 }}
          transition={{ opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }, scale: { duration: 0.1, ease: 'linear' } }}
          src={backdropPath.startsWith('http') ? backdropPath : `${IMG_BACKDROP}${backdropPath}`}
          alt=""
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: `translateY(${clampedScroll * 0.35}px)`,
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.12) 32%, rgba(0,0,0,0.9) 100%)' }} />

      <button
        onClick={onClose}
        aria-label={t('common.close')}
        className="btn-press glass absolute flex items-center justify-center"
        style={{ top: 14, left: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)' }}
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
            className="btn-press glass flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)' }}
          >
            <MoreVertical size={18} color="#fff" />
          </button>
        )}
        {menuOpen && (
          <div
            role="menu"
            className="fade-slide-down glass-strong absolute right-0 mt-1 rounded-lg overflow-hidden z-10"
            style={{ minWidth: 190, boxShadow: 'var(--shadow-md)' }}
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

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="absolute"
        style={{ left: 16, right: 16, bottom: 14 }}
      >
        <h1 className="font-display text-3xl leading-tight" style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {subtitle}
          </p>
        )}
      </motion.div>
    </div>
  );
}
