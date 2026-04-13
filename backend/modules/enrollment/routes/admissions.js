const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  applyAdmission,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStatus,
  generateMeritList,
} = require('../controllers/admissionController');

const router = express.Router();

router.post('/apply', applyAdmission);
router.get('/status/:applicationNumber', getApplicationStatus);
router.get('/', protect, authorize('admin'), getApplications);
router.get('/merit/:departmentId', protect, authorize('admin'), generateMeritList);
router.get('/:id', protect, authorize('admin'), getApplication);
router.put('/:id/status', protect, authorize('admin'), updateApplicationStatus);

module.exports = router;
