import { useState } from 'react';
import { FolderPlus, Trash2, ChevronDown, X, Bookmark, Pencil, Globe } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import ListMetaModal from './ListMetaModal.jsx';
import { useI18n } from '../../i18n/index.jsx';

export default function ListsLibrary({ lists, library, filmLibrary, onCreateList, onDeleteList, onRemoveFromList, onUpdateListMeta, onOpenShow, onOpenFilm }) {
  const { t } = useI18n();
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const listArr = Object.values(lists).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={t('library.newListPlaceholder')}
          className="flex-1 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
        <button onClick={() => { if (newName.trim()) { onCreateList(newName); setNewName(''); } }}
          className="btn-press px-4 rounded-lg" style={{ background: 'var(--amber)' }} aria-label={t('library.newListPlaceholder')}>
          <FolderPlus size={18} color="var(--on-accent)" />
        </button>
      </div>

      {listArr.length === 0 ? (
        <EmptyState icon={Bookmark} text={t('library.emptyLists')} />
      ) : listArr.map(list => {
        const isOpen = expanded === list.id;
        const coverItem = list.items[0];
        const coverData = coverItem ? (coverItem.type === 'show' ? library[coverItem.id] : filmLibrary[coverItem.id]) : null;
        return (
          <div key={list.id} className="season-card mb-2 rounded-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
            <button onClick={() => setExpanded(isOpen ? null : list.id)} className="episode-row w-full flex items-center gap-3 p-3" aria-expanded={isOpen}>
              {coverData ? (
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-alt)' }}>
                  <Poster path={coverData.poster_path} fill alt="" />
                </div>
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: 'var(--surface-alt)' }} />
              )}
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-body font-semibold text-sm truncate">{list.name}</p>
                  {list.isPublic && <Globe size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                </div>
                <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{list.items.length}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span onClick={(e) => { e.stopPropagation(); setEditingList(list); }} style={{ color: 'var(--muted)' }} role="button" aria-label={t('common.edit')}>
                  <Pencil size={14} />
                </span>
                <span onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} style={{ color: 'var(--tally)' }} role="button" aria-label={t('common.delete')}>
                  <Trash2 size={15} />
                </span>
                <ChevronDown size={16} className="chevron" style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
                {list.description && <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{list.description}</p>}
                {list.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {list.tags.map((tag) => (
                      <span key={tag} className="font-mono px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: 'var(--surface-alt)', color: 'var(--muted)' }}>{tag}</span>
                    ))}
                  </div>
                )}
                {list.items.length === 0 ? (
                  <p className="font-body text-xs" style={{ color: 'var(--muted)' }}>{t('library.listEmptyItems')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {list.items.map(item => {
                      const data = item.type === 'show' ? library[item.id] : filmLibrary[item.id];
                      if (!data) return null;
                      return (
                        <div key={item.type + item.id} className="relative">
                          <button onClick={() => item.type === 'show' ? onOpenShow(item.id) : onOpenFilm(item.id)} className="card-tap text-left w-full">
                            <Poster path={data.poster_path} fill alt={item.type === 'show' ? data.name : data.title} />
                            <p className="font-body text-xs mt-1.5 truncate">{item.type === 'show' ? data.name : data.title}</p>
                          </button>
                          <button onClick={() => onRemoveFromList(list.id, item.type, item.id)} aria-label={t('common.remove')}
                            className="absolute top-1 right-1 rounded-full p-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <X size={12} color="#fff" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {editingList && (
        <ListMetaModal
          list={editingList}
          onSave={(fields) => onUpdateListMeta(editingList.id, fields)}
          onClose={() => setEditingList(null)}
        />
      )}
    </div>
  );
}
