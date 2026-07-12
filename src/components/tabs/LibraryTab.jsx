import { useState } from 'react';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import CalendarTab from './CalendarTab.jsx';
import SeriesLibrary from './SeriesLibrary.jsx';
import FilmLibrary from './FilmLibrary.jsx';
import ListsLibrary from './ListsLibrary.jsx';
import { useI18n } from '../../i18n/index.jsx';

export default function LibraryTab({
  library, watchedCountForShow, onOpen, filmLibrary, onOpenFilm, lists, onCreateList, onDeleteList, onRemoveFromList, onUpdateListMeta,
  apiKey, setError, onToggleEpisode, collapsedSections, onToggleSection, libraryViewMode, onSetLibraryViewMode,
}) {
  const { t } = useI18n();
  const [segment, setSegment] = useState('palinsesto');

  return (
    <div>
      <SegmentedControl
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'palinsesto', label: t('nav.calendar') },
          { value: 'serie', label: t('library.segSeries') },
          { value: 'film', label: t('library.segFilms') },
          { value: 'liste', label: t('library.segLists') },
        ]}
      />
      {segment === 'palinsesto' && <CalendarTab library={library} apiKey={apiKey} setError={setError} onToggleEpisode={onToggleEpisode} />}
      {segment === 'serie' && (
        <SeriesLibrary
          library={library} watchedCountForShow={watchedCountForShow} onOpen={onOpen}
          collapsed={collapsedSections?.series || []} onToggleSection={(key) => onToggleSection('series', key)}
          view={libraryViewMode} onSetView={onSetLibraryViewMode}
        />
      )}
      {segment === 'film' && (
        <FilmLibrary
          filmLibrary={filmLibrary} onOpen={onOpenFilm}
          collapsed={collapsedSections?.films || []} onToggleSection={(key) => onToggleSection('films', key)}
        />
      )}
      {segment === 'liste' && (
        <ListsLibrary
          lists={lists} library={library} filmLibrary={filmLibrary}
          onCreateList={onCreateList} onDeleteList={onDeleteList} onRemoveFromList={onRemoveFromList} onUpdateListMeta={onUpdateListMeta}
          onOpenShow={onOpen} onOpenFilm={onOpenFilm}
        />
      )}
    </div>
  );
}
