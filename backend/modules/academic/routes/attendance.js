const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  getAttendanceReport,
  updateAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');

const router = express.Router();

router.post('/mark', protect, authorize('faculty'), markAttendance);
router.get('/', protect, authorize('admin', 'faculty'), getAttendance);
router.get('/summary', protect, authorize('admin', 'faculty'), getAttendanceSummary);
router.get('/student', protect, authorize('student'), getStudentAttendance);
router.get('/student', protect, authorize('student'), getStudentAttendance);
router.get('/report/:courseId', protect, authorize('faculty', 'admin'), getAttendanceReport);
router.put('/:id', protect, authorize('faculty'), updateAttendance);

module.exports = router;
