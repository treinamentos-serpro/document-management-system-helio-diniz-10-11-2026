import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, userId, loading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title" aria-busy={loading}>
      <div className="section-heading">
        <h2 id="documents-title">Meus documentos</h2>
        <button className="secondary" type="button" onClick={onRefresh} disabled={loading}>
          Atualizar lista
        </button>
      </div>
      {loading ? <p role="status">Carregando documentos...</p> : error ? (
        <p className="error" role="alert">{error}</p>
      ) : documents.length === 0 ? (
        <p className="empty-state">Nenhum documento enviado.</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <div className="document-details">
                <h3>{document.originalName}</h3>
                <p>
                  {formatSize(document.size)} ·{' '}
                  <time dateTime={document.uploadedAt}>
                    {dateFormatter.format(new Date(document.uploadedAt))}
                  </time>
                </p>
              </div>
              <DownloadButton document={document} userId={userId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}