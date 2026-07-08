import { useState } from 'react';
import {
  X, User, Palette, Globe, Bell, Shield, Lock, Database, Info, LifeBuoy, LogOut, Loader2, Send, CheckCircle2,
} from 'lucide-react';
import SettingsSection from './SettingsSection.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import BackupSection from './BackupSection.jsx';
import ToggleSwitch from '../ui/ToggleSwitch.jsx';
import EditProfileModal from '../profile/EditProfileModal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useI18n, LOCALES, SUPPORTED_LANGS } from '../../i18n/index.jsx';
import { useTheme, ACCENTS, ACCENT_PREVIEW } from '../../theme/ThemeContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { upsertProfile } from '../../lib/profiles.js';
import { sendFeedback } from '../../lib/feedback.js';

const APP_VERSION = '2.0.0';

export default function SettingsPage({
  onClose,
  onExport, onImport, onExportJSON, onImportJSON, showCount,
  onExportFilms, onImportFilms, onExportFilmsJSON, onImportFilmsJSON, filmCount,
  onExportLists, onImportLists, onExportListsJSON, onImportListsJSON, listCount,
  autoPauseMonths, onSetAutoPauseMonths,
}) {
  const { t, lang, setLang } = useI18n();
  useBackHandler(onClose);
  const { mode, setMode, accent, setAccent, textSize, setTextSize } = useTheme();
  const { user, profile, refreshProfile, logout } = useAuth();
  const toast = useToast();

  const [open, setOpen] = useState('account');
  const [editingProfile, setEditingProfile] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const notifPrefs = profile?.notification_prefs || { friend_requests: true, review_likes: true, friend_activity: true };
  const privacy = profile?.privacy || { visibility: 'public', show_activity: true };

  function toggleSection(id) { setOpen(open === id ? null : id); }

  async function updateNotifPref(key, value) {
    const next = { ...notifPrefs, [key]: value };
    try {
      await upsertProfile(user.id, { notification_prefs: next });
      refreshProfile();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function updatePrivacy(key, value) {
    const next = { ...privacy, [key]: value };
    try {
      await upsertProfile(user.id, { privacy: next });
      refreshProfile();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleThemeChange(next) {
    setMode(next);
    toast.success(t('toast.themeUpdated'));
    if (user) upsertProfile(user.id, { theme: next }).catch(() => {});
  }

  async function handleAccentChange(next) {
    setAccent(next);
    if (user) upsertProfile(user.id, { accent_color: next }).catch(() => {});
  }

  async function handleTextSizeChange(next) {
    setTextSize(next);
    if (user) upsertProfile(user.id, { text_size: next }).catch(() => {});
  }

  async function handleLangChange(next) {
    setLang(next);
    toast.success(t('toast.languageUpdated'));
    if (user) upsertProfile(user.id, { language: next }).catch(() => {});
  }

  async function handleSendResetLink() {
    setSendingReset(true);
    try {
      await supabase.auth.resetPasswordForEmail(user.email);
      setResetSent(true);
    } catch (e) { toast.error(t('common.somethingWrong')); }
    setSendingReset(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet w-full rounded-t-2xl overflow-y-auto"
        style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '92vh', border: '1px solid var(--border)', borderBottom: 'none' }}
      >
        <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-2xl">{t('settings.title')}</h2>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>

        <div className="p-4">
          <SettingsSection icon={User} title={t('settings.sectionAccount')} isOpen={open === 'account'} onToggle={() => toggleSection('account')}>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('settings.accountEmail')}</p>
            <p className="font-body text-sm mb-4">{user?.email}</p>
            <button
              onClick={() => setConfirmLogout(true)}
              className="btn-press flex items-center gap-2 w-full justify-center py-3 rounded-full font-body font-semibold text-sm"
              style={{ background: 'var(--surface-alt)', color: 'var(--danger-text)', border: '1px solid var(--danger-bg)' }}
            >
              <LogOut size={15} /> {t('settings.accountLogout')}
            </button>
          </SettingsSection>

          <SettingsSection icon={User} title={t('settings.sectionProfile')} isOpen={open === 'profile'} onToggle={() => toggleSection('profile')}>
            <p className="font-body text-sm mb-3" style={{ color: 'var(--muted)' }}>{t('settings.profileEditDesc')}</p>
            <button
              onClick={() => setEditingProfile(true)}
              className="btn-press w-full py-2.5 rounded-full font-body font-semibold text-sm"
              style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}
            >
              {t('settings.profileEdit')}
            </button>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <ToggleRow
                label={t('games.enableLater')}
                desc={t('games.enableLaterDesc')}
                checked={!!profile?.tracks_games}
                onChange={(v) => { upsertProfile(user.id, { tracks_games: v }).then(refreshProfile).catch(() => toast.error(t('common.somethingWrong'))); }}
                last
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={Palette} title={t('settings.sectionAppearance')} isOpen={open === 'appearance'} onToggle={() => toggleSection('appearance')}>
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('settings.appearanceTheme')}</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
                { value: 'system', label: t('settings.themeSystem') },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className="btn-press flex-1 py-2 rounded-lg font-body text-xs font-semibold"
                  style={{ background: mode === opt.value ? 'var(--amber)' : 'var(--surface-alt)', color: mode === opt.value ? 'var(--on-accent)' : 'var(--text)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('settings.appearanceAccent')}</p>
            <div className="flex gap-3 mb-4" role="radiogroup" aria-label={t('settings.appearanceAccent')}>
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  role="radio"
                  aria-checked={accent === a}
                  aria-label={t(`settings.accent${a.charAt(0).toUpperCase() + a.slice(1)}`)}
                  onClick={() => handleAccentChange(a)}
                  className="btn-press"
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: ACCENT_PREVIEW[a],
                    border: accent === a ? '3px solid var(--text)' : '2px solid var(--border)',
                  }}
                />
              ))}
            </div>

            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('settings.appearanceTextSize')}</p>
            <div className="flex gap-2">
              {[
                { value: 'small', label: t('settings.textSmall') },
                { value: 'normal', label: t('settings.textNormal') },
                { value: 'large', label: t('settings.textLarge') },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTextSizeChange(opt.value)}
                  className="btn-press flex-1 py-2 rounded-lg font-body text-xs font-semibold"
                  style={{ background: textSize === opt.value ? 'var(--amber)' : 'var(--surface-alt)', color: textSize === opt.value ? 'var(--on-accent)' : 'var(--text)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection icon={Globe} title={t('settings.sectionLanguage')} isOpen={open === 'language'} onToggle={() => toggleSection('language')}>
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('settings.languageLabel')}</p>
            <div className="flex gap-2">
              {SUPPORTED_LANGS.map((code) => (
                <button
                  key={code}
                  onClick={() => handleLangChange(code)}
                  className="btn-press flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-body text-xs font-semibold"
                  style={{ background: lang === code ? 'var(--amber)' : 'var(--surface-alt)', color: lang === code ? 'var(--on-accent)' : 'var(--text)' }}
                >
                  {LOCALES[code].flag} {LOCALES[code].label}
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection icon={Bell} title={t('settings.sectionNotifications')} isOpen={open === 'notifications'} onToggle={() => toggleSection('notifications')}>
            <ToggleRow label={t('settings.notifFriendRequests')} desc={t('settings.notifFriendRequestsDesc')} checked={notifPrefs.friend_requests} onChange={(v) => updateNotifPref('friend_requests', v)} />
            <ToggleRow label={t('settings.notifReviewLikes')} desc={t('settings.notifReviewLikesDesc')} checked={notifPrefs.review_likes} onChange={(v) => updateNotifPref('review_likes', v)} />
            <ToggleRow label={t('settings.notifFriendActivity')} desc={t('settings.notifFriendActivityDesc')} checked={notifPrefs.friend_activity} onChange={(v) => updateNotifPref('friend_activity', v)} last />
          </SettingsSection>

          <SettingsSection icon={Shield} title={t('settings.sectionPrivacy')} isOpen={open === 'privacy'} onToggle={() => toggleSection('privacy')}>
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('settings.privacyVisibility')}</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'public', label: t('settings.privacyPublic') },
                { value: 'friends', label: t('settings.privacyFriendsOnly') },
                { value: 'private', label: t('settings.privacyPrivate') },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updatePrivacy('visibility', opt.value)}
                  className="btn-press flex-1 py-2 rounded-lg font-body text-xs font-semibold"
                  style={{ background: privacy.visibility === opt.value ? 'var(--amber)' : 'var(--surface-alt)', color: privacy.visibility === opt.value ? 'var(--on-accent)' : 'var(--text)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <ToggleRow label={t('settings.privacyShowActivity')} checked={privacy.show_activity} onChange={(v) => updatePrivacy('show_activity', v)} last />
          </SettingsSection>

          <SettingsSection icon={Lock} title={t('settings.sectionSecurity')} isOpen={open === 'security'} onToggle={() => toggleSection('security')}>
            <p className="font-body text-sm font-semibold mb-1">{t('settings.securityChangePassword')}</p>
            <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{t('settings.securityChangePasswordDesc')}</p>
            <button
              onClick={handleSendResetLink}
              disabled={sendingReset}
              className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold"
              style={{ background: 'var(--surface-alt)', color: 'var(--text)' }}
            >
              {sendingReset && <Loader2 size={14} className="animate-spin" />}
              {t('settings.securitySendLink')}
            </button>
            {resetSent && <p className="font-body text-xs mt-2" style={{ color: 'var(--watched)' }}>{t('settings.securityLinkSent')}</p>}
          </SettingsSection>

          <SettingsSection icon={Database} title={t('settings.sectionData')} isOpen={open === 'data'} onToggle={() => toggleSection('data')}>
            <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{t('settings.intro')}</p>

            <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-body text-sm font-semibold mb-1">{t('library.autoPauseLabel')}</p>
              <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{t('library.autoPauseDesc')}</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 0, label: t('library.autoPauseOff') },
                  { value: 1, label: t('library.autoPause1') },
                  { value: 2, label: t('library.autoPause2') },
                  { value: 3, label: t('library.autoPause3') },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSetAutoPauseMonths(opt.value)}
                    className="btn-press px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                    style={{ background: autoPauseMonths === opt.value ? 'var(--amber)' : 'var(--surface-alt)', color: autoPauseMonths === opt.value ? 'var(--on-accent)' : 'var(--text)' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="font-display text-lg mt-6 mb-1" style={{ letterSpacing: '0.04em' }}>{t('settings.backupTitle')}</p>
            <p className="font-body text-xs" style={{ color: 'var(--muted)' }}>{t('settings.backupIntro')}</p>

            <BackupSection title={t('settings.backupSeriesTitle')} description={t('settings.backupSeriesDesc')} count={showCount} onExportCSV={onExport} onImportCSV={onImport} onExportJSON={onExportJSON} onImportJSON={onImportJSON} />
            <BackupSection title={t('settings.backupFilmsTitle')} description={t('settings.backupFilmsDesc')} count={filmCount} onExportCSV={onExportFilms} onImportCSV={onImportFilms} onExportJSON={onExportFilmsJSON} onImportJSON={onImportFilmsJSON} />
            <BackupSection title={t('settings.backupListsTitle')} description={t('settings.backupListsDesc')} count={listCount} onExportCSV={onExportLists} onImportCSV={onImportLists} onExportJSON={onExportListsJSON} onImportJSON={onImportListsJSON} />
          </SettingsSection>

          <SettingsSection icon={Info} title={t('settings.sectionAbout')} isOpen={open === 'about'} onToggle={() => toggleSection('about')}>
            <p className="font-body text-sm mb-1">{t('settings.aboutVersion')}: <span className="font-mono">{APP_VERSION}</span></p>
            <p className="font-body text-xs mt-3" style={{ color: 'var(--muted)' }}>{t('settings.aboutTmdbAttribution')}</p>
            <p className="font-body text-xs mt-2" style={{ color: 'var(--muted)' }}>{t('settings.aboutMadeWith')}</p>
          </SettingsSection>

          <SettingsSection icon={LifeBuoy} title={t('settings.sectionSupport')} isOpen={open === 'support'} onToggle={() => toggleSection('support')}>
            <p className="font-body text-sm font-semibold mb-1">{t('settings.supportContact')}</p>
            <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{t('settings.supportContactDesc')}</p>
            <FeedbackForm />
          </SettingsSection>
        </div>
      </div>

      {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
      {confirmLogout && (
        <ConfirmDialog
          title={t('settings.accountLogout')}
          body={t('settings.accountLogoutConfirm')}
          confirmLabel={t('settings.accountLogout')}
          cancelLabel={t('common.cancel')}
          danger
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => { setConfirmLogout(false); logout(); }}
        />
      )}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, last }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ paddingBottom: last ? 0 : 12, marginBottom: last ? 0 : 12, borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div className="min-w-0">
        <p className="font-body text-sm font-medium">{label}</p>
        {desc && <p className="font-body text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>}
      </div>
      <ToggleSwitch checked={!!checked} onChange={onChange} label={label} />
    </div>
  );
}

function FeedbackForm() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await sendFeedback(message.trim(), profile?.username || profile?.display_name, user?.email);
      setSent(true);
      setMessage('');
    } catch (e) {
      setSent(false);
    }
    setSending(false);
  }

  if (sent) {
    return (
      <div className="fade-in flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
        <CheckCircle2 size={16} />
        <span className="font-body text-sm">{t('settings.feedbackSent')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="feedback-message" className="sr-only">{t('settings.feedbackPlaceholder')}</label>
      <textarea
        id="feedback-message"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
        placeholder={t('settings.feedbackPlaceholder')}
        rows={4}
        className="w-full px-3 py-2.5 rounded-lg font-body text-sm outline-none resize-none"
        style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}
      />
      <button
        type="submit"
        disabled={!message.trim() || sending}
        className="btn-press mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-bold text-sm"
        style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: (!message.trim() || sending) ? 0.6 : 1 }}
      >
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {t('settings.feedbackSend')}
      </button>
    </form>
  );
}
