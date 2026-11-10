import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments, uploadDocument, downloadDocument } from '../src/services/documentApi.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('lista via /api com usuário e sinal de cancelamento', async () => {
  const documents = [{ id: 'doc-1', originalName: 'contrato.txt' }];
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.signal, controller.signal);
    return Response.json(documents);
  };
  assert.deepEqual(await listDocuments('alice', controller.signal), documents);
});

test('envia arquivo como multipart sem definir Content-Type manualmente', async () => {
  const file = new File(['conteúdo'], 'contrato.txt');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('file').name, file.name);
    assert.equal(await options.body.get('file').text(), await file.text());
    return Response.json({ id: 'doc-1' }, { status: 201 });
  };
  assert.deepEqual(await uploadDocument(file, 'alice'), { id: 'doc-1' });
});

test('baixa o conteúdo binário usando o cabeçalho de usuário', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents/doc%2F1/download');
    assert.equal(options.headers['X-User-Id'], 'alice');
    return new Response(new Uint8Array([0, 128, 255]));
  };
  const blob = await downloadDocument('doc/1', 'alice');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 128, 255]));
});

test('preserva a mensagem de erro do backend', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Documento não encontrado.' }, { status: 404 });
  await assert.rejects(downloadDocument('inexistente', 'alice'), /Documento não encontrado/);
});

test('trata respostas de erro sem JSON e falhas de conexão', async () => {
  globalThis.fetch = async () => new Response('Bad Gateway', { status: 502 });
  await assert.rejects(listDocuments('alice'), /Não foi possível concluir/);
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(listDocuments('alice'), /Não foi possível conectar/);
});

test('preserva erros de cancelamento', async () => {
  globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError'); };
  await assert.rejects(listDocuments('alice'), { name: 'AbortError' });
});