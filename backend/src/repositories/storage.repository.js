const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

function prepareDirectory(callback) {
  fs.mkdir(config.storageDir, { recursive: true }, (error) => callback(error, config.storageDir));
}

function getFilePath(storedName) {
  if (typeof storedName !== 'string' || path.basename(storedName) !== storedName) {
    throw new TypeError('Nome interno de arquivo inválido.');
  }

  const filePath = path.resolve(config.storageDir, storedName);
  if (path.dirname(filePath) !== config.storageDir) {
    throw new TypeError('Nome interno de arquivo inválido.');
  }

  return filePath;
}

function removeUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

module.exports = {
  prepareDirectory,
  getFilePath,
  removeUploadedFile,
};