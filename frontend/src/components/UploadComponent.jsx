import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    setError('');
    setMessage('');
    if (file.size === 0) {
      setError('Selecione um arquivo que não esteja vazio.');
      return;
    }

    const form = event.currentTarget;
    setUploading(true);
    try {
      await uploadDocument(file, userId);
      form.reset();
      setFile(null);
      setMessage('Documento enviado com sucesso.');
      onUploaded();
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form className="upload-form" onSubmit={handleSubmit} aria-busy={uploading}>
        <label className="file-field" htmlFor="document-file">
          Arquivo
          <input
            id="document-file"
            type="file"
            required
            disabled={uploading}
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setMessage('');
            }}
          />
        </label>
        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="success" role="status">{message}</p>
    </section>
  );
}