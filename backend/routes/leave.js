const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getDeptLeaves,
  getAllLeaves,
  updateStatus,
} = require('../controllers/leaveController');

const router = express.Router();

router.route('/')
  .get(protect, getMyLeaves)
  .post(protect, applyLeave);

router.get('/all', protect, admin, getAllLeaves);
router.get('/department', protect, getDeptLeaves); // HOD logic handled in controller

router.route('/:id')
  .patch(protect, updateStatus); // Admin or HOD logic in controller

module.exports = router;
