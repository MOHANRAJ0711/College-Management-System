const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  generatePayroll,
  getPayrollRecords,
  getMyPayslips,
  markAsPaid,
} = require('../controllers/payrollController');

const router = express.Router();

router.get('/my-payslips', protect, getMyPayslips);
router.post('/generate', protect, authorize('admin'), generatePayroll);
router.get('/all', protect, authorize('admin'), getPayrollRecords);
router.patch('/:id/pay', protect, authorize('admin'), markAsPaid);

module.exports = router;
