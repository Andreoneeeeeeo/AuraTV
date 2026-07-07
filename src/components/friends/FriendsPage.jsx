import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Check, X, Loader2, Users } from 'lucide-react';
import FriendRow from './FriendRow.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  loadFriendGraph, sendFriendRequest, cancelFriendRequest,
  respondFriendRequest, removeFriendship, relationshipWith,
} from '../../lib/friends.js';
import { searchProfiles } from '../../lib/profiles.js';

export default function FriendsPage({ onClose, embedded = false }) {
  const { t } = useI18n();
  useBackHandler(onClose, !embedded);
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [graph, setGraph] = useState({ friends: [], received: [], sent: [] });
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relations, setRelations] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const g = await loadFriendGraph(user.id);
      setGraph(g);
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProfiles(query, user.id);
        setSearchResults(results);
        const rels = {};
        await Promise.all(results.map(async (p) => { rels[p.id] = await relationshipWith(user.id, p.id); }));
        setRelations(rels);
      } catch (e) {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(handle);
  }, [query, user.id]);

  async function handleSendRequest(targetId) {
    try {
      await sendFriendRequest(user.id, targetId);
      toast.success(t('friends.requestSentToast'));
      setRelations(prev => ({ ...prev, [targetId]: { status: 'pending', requester_id: user.id } }));
      load();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleAccept(requestId) {
    try {
      await respondFriendRequest(requestId, true, user.id);
      toast.success(t('friends.requestAccepted'));
      load();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleDecline(requestId) {
    try {
      await respondFriendRequest(requestId, false, user.id);
      toast.info(t('friends.requestDeclined'));
      load();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleCancel(requestId) {
    try {
      await cancelFriendRequest(requestId);
      load();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleRemove(friendshipId, name) {
    if (!window.confirm(t('friends.removeFriendConfirm', { name }))) return;
    try {
      await removeFriendship(friendshipId);
      toast.info(t('friends.friendRemoved'));
      load();
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  const content = (
    <div className={embedded ? '' : 'p-4'}>
      <div className="relative mb-4">
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('friends.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg font-body text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      </div>

      {query.trim() ? (
        <div>
          {searching ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={20} /></div>
          ) : searchResults.length === 0 ? (
            <p className="font-body text-sm text-center py-6" style={{ color: 'var(--muted)' }}>{t('friends.noUsersFound')}</p>
          ) : (
            searchResults.map((p) => {
              const rel = relations[p.id];
              return (
                <FriendRow key={p.id} profile={p}>
                  {rel?.status === 'accepted' ? (
                    <span className="font-mono text-xs" style={{ color: 'var(--watched)' }}>{t('friends.alreadyFriends')}</span>
                  ) : rel?.status === 'pending' ? (
                    <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('friends.requestSent')}</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(p.id)}
                      className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                      style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}
                    >
                      <UserPlus size={13} /> {t('friends.sendRequest')}
                    </button>
                  )}
                </FriendRow>
              );
            })
          )}
        </div>
      ) : (
        <>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'friends', label: `${t('friends.tabFriends')} (${graph.friends.length})` },
              { value: 'received', label: `${t('friends.tabReceived')}${graph.received.length ? ' •' + graph.received.length : ''}` },
              { value: 'sent', label: t('friends.tabSent') },
            ]}
          />

          {loading ? (
            <SkeletonRows count={3} height={60} />
          ) : tab === 'friends' ? (
            graph.friends.length === 0 ? (
              <EmptyState icon={Users} text={t('friends.noFriends')} />
            ) : graph.friends.map(({ friendshipId, profile }) => (
              <FriendRow key={friendshipId} profile={profile}>
                <button onClick={() => handleRemove(friendshipId, profile.display_name || profile.username)} className="btn-press font-mono text-xs" style={{ color: 'var(--tally)' }}>
                  {t('friends.removeFriend')}
                </button>
              </FriendRow>
            ))
          ) : tab === 'received' ? (
            graph.received.length === 0 ? (
              <EmptyState icon={Users} text={t('friends.noReceived')} />
            ) : graph.received.map(({ requestId, profile }) => (
              <FriendRow key={requestId} profile={profile}>
                <button onClick={() => handleAccept(requestId)} aria-label={t('friends.accept')} className="btn-press p-2 rounded-full" style={{ background: 'var(--watched)' }}>
                  <Check size={14} color="#fff" />
                </button>
                <button onClick={() => handleDecline(requestId)} aria-label={t('friends.decline')} className="btn-press p-2 rounded-full" style={{ background: 'var(--surface-alt)' }}>
                  <X size={14} style={{ color: 'var(--muted)' }} />
                </button>
              </FriendRow>
            ))
          ) : (
            graph.sent.length === 0 ? (
              <EmptyState icon={Users} text={t('friends.noSent')} />
            ) : graph.sent.map(({ requestId, profile }) => (
              <FriendRow key={requestId} profile={profile}>
                <button onClick={() => handleCancel(requestId)} className="btn-press font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {t('friends.cancelRequest')}
                </button>
              </FriendRow>
            ))
          )}
        </>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-sheet w-full rounded-t-2xl overflow-y-auto"
        style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '88vh', border: '1px solid var(--border)', borderBottom: 'none' }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-2xl flex items-center gap-2"><Users size={20} /> {t('friends.title')}</h2>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>
        {content}
      </div>
    </div>
  );
}
