import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import StarRating from './StarRating.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function ReviewForm({ existing, onSubmit, onCancel }) {
  const { t } = useI18n();
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [body, setBody] = useState(existing?.body || '');
  const [hasSpoilers, setHasSpoilers] = useState(existing?.has_spoilers || false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { toast.error(t('reviews.ratingRequired')); return; }
    setSaving(true);
    try {
      await onSubmit({ rating, body: body.trim(), hasSpoilers });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="font-body text-sm font-semibold mb-2">{existing ? t('reviews.editReview') : t('reviews.writeReview')}</p>

      <label className="font-mono text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>{t('reviews.yourRating')}</label>
      <StarRating value={rating} onChange={setRating} label={t('reviews.yourRating')} />

      <label htmlFor="review-body" className="sr-only">{t('reviews.bodyPlaceholder')}</label>
      <textarea
        id="review-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('reviews.bodyPlaceholder')}
        rows={4}
        className="w-full mt-3 px-3 py-2.5 rounded-lg font-body text-sm outline-none resize-none"
        style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}
      />

      <label className="flex items-center gap-2 mt-3 font-body text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
        <input type="checkbox" checked={hasSpoilers} onChange={(e) => setHasSpoilers(e.target.checked)} style={{ width: 16, height: 16 }} />
        {t('reviews.spoilerToggle')}
      </label>

      <div className="flex gap-2 justify-end mt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-press px-4 py-2 rounded-full font-body text-sm font-semibold" style={{ background: 'var(--surface-alt)', color: 'var(--text)' }}>
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn-press flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm font-bold"
          style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: saving ? 0.7 : 1 }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {existing ? t('reviews.update') : t('reviews.submit')}
        </button>
      </div>
    </form>
  );
}
