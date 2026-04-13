const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  enterMarks,
  getResults,
  getStudentResults,
  publishResults,
  getResultAnalysis,
} = require('../controllers/resultController');

const router = express.Router();

router.post('/enter', protect, authorize('faculty'), enterMarks);
router.get('/student', protect, authorize('student'), getStudentResults);
router.get('/', protect, getResults);
router.put('/publish/:examId', protect, authorize('faculty', 'admin'), publishResults);
router.get('/analysis/:examId', protect, authorize('faculty', 'admin'), getResultAnalysis);

module.exports = router;
