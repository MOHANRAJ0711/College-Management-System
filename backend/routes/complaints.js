const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/complaintController');

router.post('/', protect, authorize('student'), ctrl.createComplaint);
router.get('/my', protect, authorize('student'), ctrl.getMyComplaints);
router.get('/', protect, authorize('admin', 'faculty'), ctrl.getAllComplaints);
router.put('/:id/status', protect, authorize('admin', 'faculty'), ctrl.updateComplaintStatus);

module.exports = router;
