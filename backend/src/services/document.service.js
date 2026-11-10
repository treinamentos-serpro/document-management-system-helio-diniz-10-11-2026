const documentRepository = require('../repositories/document.repository');

// Erro de regra de negócio; o controller traduz o código para status HTTP.
class DocumentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
  }
}

// O nome físico do arquivo é o próprio id gerado pelo multer (RNF-06).
function createDocument({ file, owner }) {
  if (!file) {
    throw new DocumentError('VALIDATION', 'O arquivo é obrigatório no campo "file".');
  }
  if (file.size === 0) {
    throw new DocumentError('VALIDATION', 'O arquivo enviado está vazio.');
  }

  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
  };

  documentRepository.save(document);
  return document;
}

function listDocumentsByOwner(owner) {
  return documentRepository.findByOwner(owner);
}

function getDownloadInfo(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new DocumentError('NOT_FOUND', 'Documento não encontrado.');
  }

  return {
    storedName: document.storedName,
    originalName: document.originalName,
  };
}

module.exports = {
  DocumentError,
  createDocument,
  listDocumentsByOwner,
  getDownloadInfo,
};
