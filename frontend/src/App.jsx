import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

function DocumentWorkspace({ userId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  function refreshDocuments() {
    setRevision((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(userId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId, revision]);

  return (
    <>
      <UploadComponent userId={userId} onUploaded={refreshDocuments} />
      <DocumentList
        documents={documents}
        userId={userId}
        loading={loading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </>
  );
}

export default function App() {
  const [userId, setUserId] = useState('');
  const [userInput, setUserInput] = useState('');

  function handleUserSubmit(event) {
    event.preventDefault();
    setUserId(userInput.trim());
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Document Management System</p>
        <h1>Documentos</h1>
      </header>
      <form className="user-form" onSubmit={handleUserSubmit}>
        <label htmlFor="user-id">Identificador do usuário</label>
        <div className="user-controls">
          <input
            id="user-id"
            name="userId"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            required
            autoComplete="username"
          />
          <button type="submit" disabled={!userInput.trim() || userInput.trim() === userId}>
            {userId ? 'Trocar usuário' : 'Abrir documentos'}
          </button>
        </div>
      </form>
      {userId && <DocumentWorkspace key={userId} userId={userId} />}
    </main>
  );
}
