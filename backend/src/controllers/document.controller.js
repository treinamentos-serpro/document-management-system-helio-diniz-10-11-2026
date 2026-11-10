const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const config = require('../config');
const documentService = require('../services/document.service');
const { DocumentError } = documentService;

const MISSING_USER_MESSAGE = 'O cabeçalho X-User-Id é obrigatório.';
const INTERNAL_ERROR_MESSAGE = 'Erro interno ao processar a requisição.';

const STATUS_BY_ERROR_CODE = {
  VALIDATION: 400,
  NOT_FOUND: 404,
};

// Armazenamento local com diskStorage; o nome físico é um UUID, nunca o nome enviado.
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(config.storageDir, { recursive: true }, (error) => callback(error, config.storageDir));
    },
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: config.maxUploadSizeBytes },
}).single('file');

function readOwner(req) {
  const owner = req.get('X-User-Id');
  return owner && owner.trim() ? owner.trim() : null;
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function sendServiceError(res, error) {
  if (error instanceof DocumentError) {
    return sendError(res, STATUS_BY_ERROR_CODE[error.code] ?? 400, error.message);
  }
  return sendError(res, 500, INTERNAL_ERROR_MESSAGE);
}

function sendUploadError(res, error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 413, 'O arquivo excede o tamanho máximo permitido.');
  }
  if (error.name === 'MulterError') {
    return sendError(res, 400, 'Requisição de upload inválida.');
  }
  return sendError(res, 500, INTERNAL_ERROR_MESSAGE);
}

function removeUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

function uploadDocument(req, res) {
  const owner = readOwner(req);
  if (!owner) {
    return sendError(res, 400, MISSING_USER_MESSAGE);
  }

  upload(req, res, (uploadError) => {
    if (uploadError) {
      return sendUploadError(res, uploadError);
    }

    try {
      const document = documentService.createDocument({ file: req.file, owner });
      return res.status(201).json(document);
    } catch (error) {
      removeUploadedFile(req.file);
      return sendServiceError(res, error);
    }
  });
}

function listDocuments(req, res) {
  const owner = readOwner(req);
  if (!owner) {
    return sendError(res, 400, MISSING_USER_MESSAGE);
  }

  return res.json(documentService.listDocumentsByOwner(owner));
}

function downloadDocument(req, res) {
  const owner = readOwner(req);
  if (!owner) {
    return sendError(res, 400, MISSING_USER_MESSAGE);
  }

  let downloadInfo;
  try {
    downloadInfo = documentService.getDownloadInfo(req.params.id, owner);
  } catch (error) {
    return sendServiceError(res, error);
  }

  return res.download(downloadInfo.filePath, downloadInfo.originalName, (error) => {
    if (!error || res.headersSent) {
      return;
    }
    const status = error.code === 'ENOENT' ? 404 : 500;
    const message = status === 404
      ? 'Arquivo do documento não encontrado.'
      : 'Não foi possível ler o arquivo do documento.';
    sendError(res, status, message);
  });
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
