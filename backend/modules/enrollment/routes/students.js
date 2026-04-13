const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentDashboard,
} = require('../controllers/studentController');
const { protect, authorize } = require('../../../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('student'), getStudentDashboard);
router.get('/', protect, authorize('admin', 'faculty'), getStudents);
router.post('/', protect, authorize('admin'), createStudent);
router.get('/:id', protect, getStudent);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;
