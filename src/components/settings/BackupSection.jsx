import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function BackupSection({ title, description, count, onExportCSV, onImportCSV, onExportJSON, onImportJSON }) {
  const { t } = useI18n();
  const [importMsg, setImportMsg] = useState('');

  function handleFileChange(handler, formatLabel) {
    return async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      e.target.value = '';
      setImportMsg(t('settings.importInProgress', { format: formatLabel }));
      await handler(file);
      setImportMsg(t('settings.importDone', { format: formatLabel }));
    };
  }

  return (
    <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--surface-alt)' }}>
      <p className="font-body text-sm font-semibold mb-1">{title}</p>
      <p className="font-body text-xs mb-4" style={{ color: 'var(--muted)' }}>{description}</p>

      <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>CSV</p>
      <div className="flex gap-2 flex-wrap mb-3">
        <button onClick={onExportCSV} className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <Download size={15} /> {t('settings.exportCsv', { count })}
        </button>
        <label className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold cursor-pointer" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <Upload size={15} /> {t('settings.importCsv')}
          <input type="file" accept=".csv" onChange={handleFileChange(onImportCSV, 'CSV')} className="sr-only" />
        </label>
      </div>

      <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>JSON</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onExportJSON} className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <Download size={15} /> {t('settings.exportJson', { count })}
        </button>
        <label className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm font-semibold cursor-pointer" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <Upload size={15} /> {t('settings.importJson')}
          <input type="file" accept=".json" onChange={handleFileChange(onImportJSON, 'JSON')} className="sr-only" />
        </label>
      </div>

      {importMsg && <p className="font-body text-xs mt-3" style={{ color: 'var(--watched)' }}>{importMsg}</p>}
    </div>
  );
}
