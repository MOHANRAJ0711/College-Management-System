const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  generatePayroll,
  getPayrollRecords,
  getMyPayslips,
  markAsPaid,
} = require('../controllers/payrollController');

const router = express.Router();

router.get('/my-payslips', protect, getMyPayslips);
router.post('/generate', protect, admin, generatePayroll);
router.get('/all', protect, admin, getPayrollRecords);
router.patch('/:id/pay', protect, admin, markAsPaid);

module.exports = router;
