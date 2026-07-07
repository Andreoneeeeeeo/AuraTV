import { useState } from 'react';
import { X, Globe, Lock } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function ListMetaModal({ list, onSave, onClose }) {
  const { t } = useI18n();
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || '');
  const [tagsInput, setTagsInput] = useState((list.tags || []).join(', '));
  const [isPublic, setIsPublic] = useState(!!list.isPublic);

  function handleSave() {
    const tags = tagsInput.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
    onSave({ name: name.trim() || list.name, description: description.trim(), tags, isPublic });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl overflow-y-auto" style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '85vh', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-display text-xl">{t('lists.editTitle')}</p>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>

        <div className="p-4">
          <label htmlFor="list-name" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('lists.nameLabel')}</label>
          <input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />

          <label htmlFor="list-desc" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('lists.descriptionLabel')}</label>
          <textarea
            id="list-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 280))}
            rows={3}
            placeholder={t('lists.descriptionPlaceholder')}
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg font-body text-sm outline-none resize-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />

          <label htmlFor="list-tags" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('lists.tagsLabel')}</label>
          <input
            id="list-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('lists.tagsPlaceholder')}
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />

          <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('lists.visibilityLabel')}</p>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsPublic(false)}
              className="btn-press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-semibold"
              style={{ background: !isPublic ? 'var(--amber)' : 'var(--surface-alt)', color: !isPublic ? 'var(--on-accent)' : 'var(--text)' }}
            >
              <Lock size={14} /> {t('lists.private')}
            </button>
            <button
              onClick={() => setIsPublic(true)}
              className="btn-press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-semibold"
              style={{ background: isPublic ? 'var(--amber)' : 'var(--surface-alt)', color: isPublic ? 'var(--on-accent)' : 'var(--text)' }}
            >
              <Globe size={14} /> {t('lists.public')}
            </button>
          </div>
          {isPublic && <p className="font-body text-xs mb-4" style={{ color: 'var(--muted)' }}>{t('lists.publicHint')}</p>}

          <button
            onClick={handleSave}
            className="btn-press w-full py-3 rounded-full font-body font-bold text-sm"
            style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
