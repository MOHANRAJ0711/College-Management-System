const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController');

const router = express.Router();

router.post('/', protect, authorize('admin'), createExam);
router.get('/', protect, getExams);
router.get('/:id', protect, getExam);
router.put('/:id', protect, authorize('admin'), updateExam);
router.delete('/:id', protect, authorize('admin'), deleteExam);

module.exports = router;
