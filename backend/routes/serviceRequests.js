const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/serviceRequestController');

router.post('/', protect, authorize('student'), ctrl.createRequest);
router.get('/my', protect, authorize('student'), ctrl.getMyRequests);
router.get('/', protect, authorize('admin', 'faculty'), ctrl.getAllRequests);
router.put('/:id/status', protect, authorize('admin', 'faculty'), ctrl.updateRequestStatus);

module.exports = router;
