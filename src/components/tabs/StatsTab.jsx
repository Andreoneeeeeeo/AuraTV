import { useEffect, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import StatCard from '../shared/StatCard.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import Badge from '../shared/Badge.jsx';
import HeatmapGrid from '../stats/HeatmapGrid.jsx';
import MonthlyBarChart from '../stats/MonthlyBarChart.jsx';
import TopList from '../stats/TopList.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { listReviewsByUser, computeReviewStats } from '../../lib/reviews.js';
import {
  computeStreak, computeHeatmap, computeMonthlyActivity,
  computeTopGenres, computeTopCast, computeTopDirectors, computeBestDay,
} from '../../lib/statsHelpers.js';

export default function StatsTab({ library, watchedCountForShow, filmLibrary, watchLog, gameLibrary, showGames }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [reviewStats, setReviewStats] = useState({ count: 0, avg: 0 });

  useEffect(() => {
    if (!user) return;
    listReviewsByUser(user.id).then(list => setReviewStats(computeReviewStats(list))).catch(() => {});
  }, [user]);

  const shows = Object.values(library);
  const films = Object.values(filmLibrary || {});
  const totalWatched = shows.reduce((sum, s) => sum + watchedCountForShow(s), 0);
  const totalMinutes = shows.reduce((sum, s) => sum + watchedCountForShow(s) * (s.episode_run_time || 45), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const completed = shows.filter(s => s.number_of_episodes > 0 && watchedCountForShow(s) >= s.number_of_episodes).length;

  const filmsWatched = films.filter(f => f.watched).length;
  const filmMinutes = films.filter(f => f.watched).reduce((sum, f) => sum + (f.runtime || 100), 0);
  const filmHours = Math.round(filmMinutes / 60);

  const badgeDefs = [10, 50, 100, 250, 500].map(n => ({ threshold: n, label: t('stats.badgeEpisodes', { n }), achieved: totalWatched >= n }));
  const showBadgeDefs = [1, 5, 10].map(n => ({ threshold: n, label: n === 1 ? t('stats.badgeSeriesCompleted1') : t('stats.badgeSeriesCompleted', { n }), achieved: completed >= n }));
  const filmBadgeDefs = [5, 25, 100].map(n => ({ threshold: n, label: t('stats.badgeFilmsWatched', { n }), achieved: filmsWatched >= n }));

  const streak = computeStreak(watchLog);
  const heatmapDays = computeHeatmap(watchLog, 13);
  const monthly = computeMonthlyActivity(watchLog, 6);
  const topGenres = computeTopGenres(library, filmLibrary);
  const topCast = computeTopCast(library, filmLibrary);
  const topDirectors = computeTopDirectors(library, filmLibrary);
  const bestDay = computeBestDay(watchLog);

  const games = Object.values(gameLibrary || {});
  const gameHours = games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0);
  const gamesCompleted = games.filter((g) => g.watchStatus === 'completed').length;
  const gamesBacklog = games.filter((g) => (g.watchStatus || 'planned') === 'planned').length;
  const gamesCompleted100 = games.filter((g) => g.completed100).length;
  const platformCounter = {};
  games.forEach((g) => (g.platforms || []).forEach((p) => { platformCounter[p] = (platformCounter[p] || 0) + 1; }));
  const topPlatforms = Object.entries(platformCounter).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  const gameGenreCounter = {};
  games.forEach((g) => (g.genres || []).forEach((genre) => { gameGenreCounter[genre] = (gameGenreCounter[genre] || 0) + 1; }));
  const topGameGenres = Object.entries(gameGenreCounter).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  return (
    <div>
      {/* Attività generale, trasversale a tutte le categorie */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={16} style={{ color: 'var(--tally)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('stats.streakCurrent')}</span>
          </div>
          <p className="font-mono text-2xl font-bold">{t('stats.streakDays', { n: streak.current })}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy size={16} style={{ color: 'var(--amber)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('stats.streakBest')}</span>
          </div>
          <p className="font-mono text-2xl font-bold">{t('stats.streakDays', { n: streak.best })}</p>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
        <HeatmapGrid days={heatmapDays} />
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface)' }}>
        <p className="font-body text-sm font-semibold mb-3">{t('stats.monthlyActivity')}</p>
        <MonthlyBarChart data={monthly} lang={lang} />
      </div>

      {bestDay.count > 0 && (
        <div className="rounded-xl p-4 mb-6 flex items-center justify-between" style={{ background: 'var(--surface)' }}>
          <span className="font-body text-sm font-semibold">{t('stats.bestDay')}</span>
          <span className="font-mono text-sm" style={{ color: 'var(--amber)' }}>{t('stats.bestDayCount', { count: bestDay.count })}</span>
        </div>
      )}

      {/* Serie TV */}
      <SectionLabel text={t('nav.library')} />
      <div className="grid grid-cols-2 gap-3 my-3">
        <StatCard label={t('stats.episodesWatched')} value={totalWatched} />
        <StatCard label={t('stats.hoursShows')} value={totalHours} />
        <StatCard label={t('stats.seriesFollowed')} value={shows.length} />
        <StatCard label={t('stats.seriesCompleted')} value={completed} />
      </div>

      {/* Film */}
      <SectionLabel text={t('library.segFilms')} />
      <div className="grid grid-cols-2 gap-3 my-3 mb-2">
        <StatCard label={t('stats.filmsWatched')} value={filmsWatched} />
        <StatCard label={t('stats.hoursFilms')} value={filmHours} />
        <StatCard label={t('stats.reviewsWritten')} value={reviewStats.count} />
        <StatCard label={t('stats.avgRatingGiven')} value={reviewStats.avg || '—'} />
      </div>

      <TopList title={t('stats.favoriteGenres')} items={topGenres} />
      <TopList title={t('stats.topCast')} items={topCast} />
      <TopList title={t('stats.topDirectors')} items={topDirectors} />

      {/* Videogiochi */}
      {showGames && games.length > 0 && (
        <>
          <SectionLabel text={t('games.navLabel')} />
          <div className="grid grid-cols-2 gap-3 my-3">
            <StatCard label={t('games.statsHoursPlayed')} value={gameHours} />
            <StatCard label={t('games.statsCompleted')} value={gamesCompleted} />
            <StatCard label={t('games.statsCompleted100')} value={gamesCompleted100} />
            <StatCard label={t('games.statsBacklog')} value={gamesBacklog} />
          </div>
          <TopList title={t('games.statsFavoritePlatform')} items={topPlatforms} />
          <TopList title={t('games.statsFavoriteGenre')} items={topGameGenres} />
        </>
      )}

      <SectionLabel text={t('stats.achievements')} />
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[...badgeDefs, ...showBadgeDefs, ...filmBadgeDefs].map(b => (
          <Badge key={b.label} achieved={b.achieved} label={b.label} />
        ))}
      </div>
    </div>
  );
}
