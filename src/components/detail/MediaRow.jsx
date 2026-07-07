import Poster from '../shared/Poster.jsx';

export default function MediaRow({ title, items, mediaType, onOpen }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-3">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <button key={item.id} onClick={() => onOpen(mediaType, item)} className="card-tap text-left flex-shrink-0" style={{ width: 100 }}>
            <Poster path={item.poster_path} fill alt={item.title || item.name} />
            <p className="font-body text-xs mt-1.5 truncate">{item.title || item.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
