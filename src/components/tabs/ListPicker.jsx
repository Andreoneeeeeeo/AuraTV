import { useState } from 'react';
import { X, Check, FolderPlus } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';

export default function ListPicker({ lists, itemType, itemId, onToggleMembership, onCreateList, onClose }) {
  const { t } = useI18n();
  useBackHandler(onClose);
  const [newName, setNewName] = useState('');
  const listArr = Object.values(lists).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl p-4"
        style={{ background: 'var(--bg)', maxWidth: 480, border: '1px solid var(--border)', borderBottom: 'none', maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-xl">{t('listPicker.title').toUpperCase()}</p>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>
        {listArr.length === 0 && (
          <p className="font-body text-sm mb-3" style={{ color: 'var(--muted)' }}>{t('listPicker.noLists')}</p>
        )}
        <div className="flex flex-col gap-2 mb-4">
          {listArr.map(list => {
            const inList = list.items.some(it => it.type === itemType && it.id === itemId);
            return (
              <button key={list.id} onClick={() => onToggleMembership(list.id, itemType, itemId)}
                className="episode-row flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                <span className="font-body text-sm font-medium">{list.name}</span>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${inList ? 'var(--amber)' : 'var(--muted)'}`,
                  background: inList ? 'var(--amber)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {inList && <Check size={14} color="var(--on-accent)" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('listPicker.newListPlaceholder')}
            className="flex-1 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={() => { if (newName.trim()) { onCreateList(newName); setNewName(''); } }}
            className="btn-press px-4 rounded-lg" style={{ background: 'var(--amber)' }}
            aria-label={t('listPicker.newListPlaceholder')}
          >
            <FolderPlus size={18} color="var(--on-accent)" />
          </button>
        </div>
      </div>
    </div>
  );
}
