const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  createFee,
  getFees,
  payFee,
  getStudentFees,
  getPaymentHistory,
  getFeeReport,
} = require('../controllers/feeController');

const router = express.Router();

router.post('/', protect, authorize('admin'), createFee);
router.get('/student', protect, authorize('student'), getStudentFees);
router.get('/history', protect, authorize('student'), getPaymentHistory);
router.get('/report', protect, authorize('admin'), getFeeReport);
router.get('/', protect, authorize('admin'), getFees);
router.put('/pay/:id', protect, authorize('student'), payFee);

module.exports = router;
