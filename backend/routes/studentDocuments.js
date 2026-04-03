const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const ctrl = require('../controllers/studentDocumentController');

router.post('/', protect, authorize('student'), uploadSingle('file'), ctrl.uploadDocument);
router.get('/my', protect, authorize('student'), ctrl.getMyDocuments);
router.delete('/:id', protect, authorize('student'), ctrl.deleteDocument);

module.exports = router;
