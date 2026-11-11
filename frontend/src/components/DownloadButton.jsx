import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document, userId }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    let url;
    let link;
    try {
      const blob = await downloadDocument(document.id, userId);
      url = URL.createObjectURL(blob);
      link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
    } catch (error) {
      setError(error.message);
    } finally {
      link?.remove();
      if (url) URL.revokeObjectURL(url);
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        className="secondary"
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Baixar ${document.originalName}`}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}