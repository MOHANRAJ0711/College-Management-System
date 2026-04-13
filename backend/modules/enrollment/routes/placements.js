const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  createPlacement,
  getPlacements,
  getPlacement,
  updatePlacement,
  applyPlacement,
  updateApplicantStatus,
  getStudentApplications,
} = require('../controllers/placementController');

const router = express.Router();

router.post('/', protect, authorize('admin'), createPlacement);
router.get('/student-applications', protect, authorize('student'), getStudentApplications);
router.get('/', protect, getPlacements);
router.get('/:id', protect, getPlacement);
router.put('/:id', protect, authorize('admin'), updatePlacement);
router.post('/:id/apply', protect, authorize('student'), applyPlacement);
router.put('/:id/applicant/:studentId', protect, authorize('admin'), updateApplicantStatus);

module.exports = router;
