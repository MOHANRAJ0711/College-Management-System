const express = require('express');
const {
  getEnrollmentReport,
  getAttendanceReport,
  getResultsReport,
  getPlacementsReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../../../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/enrollment', getEnrollmentReport);
router.get('/attendance', getAttendanceReport);
router.get('/results', getResultsReport);
router.get('/placements', getPlacementsReport);

module.exports = router;
