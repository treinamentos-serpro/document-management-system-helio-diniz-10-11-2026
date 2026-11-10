const path = require('node:path');

// Configuração lida de variáveis de ambiente (12-Factor App).
module.exports = {
  storageDir: process.env.DMS_STORAGE_DIR
    ? path.resolve(process.env.DMS_STORAGE_DIR)
    : path.resolve(__dirname, '..', 'storage'),
  maxUploadSizeBytes: Number(process.env.DMS_MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024,
};
