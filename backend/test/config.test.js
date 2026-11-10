const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const backendDirectory = path.resolve(__dirname, '..');

test('rejeita limite de upload inválido na inicialização', () => {
  for (const value of ['0', '-1', '1.5', 'not-a-number']) {
    const result = spawnSync(process.execPath, ['-e', "require('./src/config')"], {
      cwd: backendDirectory,
      env: { ...process.env, DMS_MAX_UPLOAD_SIZE_BYTES: value },
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0, `valor inválido aceito: ${value}`);
    assert.match(result.stderr, /DMS_MAX_UPLOAD_SIZE_BYTES/);
  }
});