const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.DMS_STORAGE_DIR = storageDir;
const app = require('../src/app');
const storageRepository = require('../src/repositories/storage.repository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('preserva o contrato HTTP e restringe documentos ao proprietário', async () => {
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const owner = `test-${randomUUID()}`;

  try {
    const form = new FormData();
    form.append('file', new Blob(['conteúdo do teste']), 'contrato.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': owner },
      body: form,
    });
    assert.equal(uploadResponse.status, 201);
    const created = await uploadResponse.json();
    assert.equal(created.originalName, 'contrato.txt');
    assert.equal(Object.hasOwn(created, 'storedName'), false);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': owner },
    });
    assert.deepEqual(await listResponse.json(), [created]);

    const otherOwnerResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'other-user' },
    });
    assert.deepEqual(await otherOwnerResponse.json(), []);

    const downloadResponse = await fetch(`${baseUrl}/documents/${created.id}/download`, {
      headers: { 'X-User-Id': owner },
    });
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'conteúdo do teste');

    const deniedResponse = await fetch(`${baseUrl}/documents/${created.id}/download`, {
      headers: { 'X-User-Id': 'other-user' },
    });
    assert.equal(deniedResponse.status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
});

test('o caminho de storage rejeita nomes com traversal', () => {
  assert.throws(() => storageRepository.getFilePath('../outside.txt'), /inválido/);
});
