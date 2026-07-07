import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Poster from '../shared/Poster.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useI18n } from '../../i18n/index.jsx';

export default function SharedListModal({ list, onClose, onOpenShow, onOpenFilm }) {
  const { t } = useI18n();
  const author = list.author || {};

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl overflow-y-auto" style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '80vh', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="font-display text-xl leading-tight">{list.name}</p>
            <Link to={`/profile/${author.username}`} onClick={onClose} className="flex items-center gap-2 mt-1">
              <Avatar url={author.avatar_url} name={author.display_name || author.username} size={20} />
              <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>@{author.username}</span>
            </Link>
          </div>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>

        <div className="p-4">
          {list.description && <p className="font-body text-sm mb-3">{list.description}</p>}
          {list.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {list.tags.map((tag) => (
                <span key={tag} className="font-mono px-2.5 py-1 rounded-full" style={{ fontSize: 11, background: 'var(--surface-alt)', color: 'var(--muted)' }}>{tag}</span>
              ))}
            </div>
          )}

          {(list.items || []).length === 0 ? (
            <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t('library.listEmptyItems')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {list.items.map((item) => (
                <button
                  key={item.type + item.id}
                  onClick={() => { onClose(); item.type === 'show' ? onOpenShow(item) : onOpenFilm(item); }}
                  className="card-tap text-left"
                >
                  <Poster path={item.poster} fill alt={item.title} />
                  <p className="font-body text-xs mt-1.5 truncate">{item.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
