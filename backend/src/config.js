const path = require('node:path');

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxUploadSize = process.env.DMS_MAX_UPLOAD_SIZE_BYTES;
const maxUploadSizeBytes = configuredMaxUploadSize
  ? Number(configuredMaxUploadSize)
  : DEFAULT_MAX_UPLOAD_SIZE_BYTES;

if (!Number.isSafeInteger(maxUploadSizeBytes) || maxUploadSizeBytes <= 0) {
  throw new Error('DMS_MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
}

// Configuração lida de variáveis de ambiente (12-Factor App).
module.exports = {
  storageDir: process.env.DMS_STORAGE_DIR
    ? path.resolve(process.env.DMS_STORAGE_DIR)
    : path.resolve(__dirname, '..', 'storage'),
  maxUploadSizeBytes,
};
