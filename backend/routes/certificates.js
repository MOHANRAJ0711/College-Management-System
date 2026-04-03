const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  generateCertificate,
  getCertificates,
  getStudentCertificates,
  downloadCertificate,
  verifyCertificate,
} = require('../controllers/certificateController');

const router = express.Router();

router.get('/verify/:certificateNumber', verifyCertificate);
router.post('/generate', protect, authorize('admin'), generateCertificate);
router.get('/student', protect, authorize('student'), getStudentCertificates);
router.get('/download/:id', protect, authorize('student', 'admin'), downloadCertificate);
router.get('/', protect, authorize('admin'), getCertificates);

module.exports = router;
