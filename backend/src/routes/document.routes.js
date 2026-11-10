const { Router } = require('express');
const documentController = require('../controllers/document.controller');

const router = Router();

router.post('/upload', documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
