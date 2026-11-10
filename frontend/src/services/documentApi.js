const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

async function request(path, userId, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...options.headers, 'X-User-Id': userId },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Não foi possível concluir a operação.');
  }

  return response;
}

export async function listDocuments(userId, signal) {
  const response = await request('/documents', userId, { signal });
  return response.json();
}

export async function uploadDocument(file, userId) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', userId, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(id, userId) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, userId);
  return response.blob();
}