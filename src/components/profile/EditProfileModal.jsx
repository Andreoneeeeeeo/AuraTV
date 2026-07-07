import { useState, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { upsertProfile, uploadAvatar, uploadBanner, isUsernameAvailable } from '../../lib/profiles.js';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function EditProfileModal({ onClose }) {
  const { t } = useI18n();
  useBackHandler(onClose);
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState(profile?.username || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState('');

  const avatarInput = useRef(null);
  const bannerInput = useRef(null);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
    } catch (e) {
      toast.error(t('profile.uploadError'));
    }
    setUploadingAvatar(false);
  }

  async function handleBannerFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadBanner(user.id, file);
      setBannerUrl(url);
    } catch (e) {
      toast.error(t('profile.uploadError'));
    }
    setUploadingBanner(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_RE.test(cleanUsername)) {
      setError(t('profile.usernameHint'));
      return;
    }
    setSaving(true);
    try {
      if (cleanUsername !== profile?.username) {
        const available = await isUsernameAvailable(cleanUsername, user.id);
        if (!available) {
          setError(t('profile.usernameTaken'));
          setSaving(false);
          return;
        }
      }
      await upsertProfile(user.id, {
        username: cleanUsername,
        display_name: displayName.trim(),
        bio: bio.slice(0, 160),
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
      });
      await refreshProfile();
      toast.success(t('profile.saveSuccess'));
      onClose();
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet w-full rounded-t-2xl overflow-y-auto"
        style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '90vh', border: '1px solid var(--border)', borderBottom: 'none' }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-2xl">{t('profile.editTitle')}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>

        <div className="p-4">
          <div className="relative mb-10">
            <div
              className="cursor-pointer"
              onClick={() => bannerInput.current?.click()}
              style={{ height: 110, borderRadius: 12, overflow: 'hidden', background: bannerUrl ? 'transparent' : 'var(--surface-alt)', backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {uploadingBanner ? <Loader2 className="animate-spin" size={20} /> : !bannerUrl && <Camera size={22} style={{ color: 'var(--muted)' }} />}
            </div>
            <input ref={bannerInput} type="file" accept="image/*" onChange={handleBannerFile} className="sr-only" aria-label={t('profile.bannerLabel')} />

            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="absolute btn-press"
              style={{ left: 16, bottom: -24 }}
              aria-label={t('profile.changePhoto')}
            >
              <div className="relative">
                <Avatar url={avatarUrl} name={displayName || username} size={64} ring />
                <div className="absolute flex items-center justify-center" style={{ inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: '50%' }}>
                  {uploadingAvatar ? <Loader2 className="animate-spin" size={16} color="#fff" /> : <Camera size={16} color="#fff" />}
                </div>
              </div>
            </button>
            <input ref={avatarInput} type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" aria-label={t('profile.avatarLabel')} />
          </div>

          {error && (
            <div role="alert" className="fade-in px-3 py-2.5 rounded-lg mb-4 text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
              {error}
            </div>
          )}

          <label htmlFor="username" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('profile.usernameLabel')}</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder={t('profile.usernamePlaceholder')}
            className="w-full mt-1.5 mb-1 px-3 py-2.5 rounded-lg font-mono text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <p className="font-body text-xs mb-4" style={{ color: 'var(--muted)' }}>{t('profile.usernameHint')}</p>

          <label htmlFor="displayName" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('profile.displayNameLabel')}</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('profile.displayNamePlaceholder')}
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />

          <label htmlFor="bio" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('profile.bioLabel')}</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder={t('profile.bioPlaceholder')}
            rows={3}
            className="w-full mt-1.5 px-3 py-2.5 rounded-lg font-body text-sm outline-none resize-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <p className="font-mono text-xs mt-1" style={{ color: 'var(--muted)' }}>{t('profile.bioHint', { count: bio.length })}</p>

          <button
            type="submit"
            disabled={saving}
            className="btn-press w-full mt-6 py-3 rounded-full font-body font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: saving ? 0.7 : 1 }}
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            {t('profile.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
