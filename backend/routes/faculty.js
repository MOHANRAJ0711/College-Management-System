const express = require('express');
const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyDashboard,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('faculty'), getFacultyDashboard);
router.get('/', protect, authorize('admin'), getFaculties);
router.post('/', protect, authorize('admin'), createFaculty);
router.get('/:id', protect, getFaculty);
router.put('/:id', protect, authorize('admin'), updateFaculty);
router.delete('/:id', protect, authorize('admin'), deleteFaculty);

module.exports = router;
