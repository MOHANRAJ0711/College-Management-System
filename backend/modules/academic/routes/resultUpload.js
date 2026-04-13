const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../../../middleware/auth');
const {
  uploadResultPDF,
  saveResultBatch,
  getResultBatches,
  getResultBatch,
  deleteResultBatch,
  downloadResultExcel,
} = require('../controllers/resultUploadController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

router.post('/upload-pdf', protect, authorize('admin', 'faculty'), upload.single('file'), uploadResultPDF);
router.post('/save', protect, authorize('admin', 'faculty'), saveResultBatch);
router.get('/batches', protect, authorize('admin', 'faculty'), getResultBatches);
router.get('/batches/:id', protect, authorize('admin', 'faculty'), getResultBatch);
router.delete('/batches/:id', protect, authorize('admin'), deleteResultBatch);
router.post('/download-excel', protect, authorize('admin', 'faculty'), downloadResultExcel);

module.exports = router;
