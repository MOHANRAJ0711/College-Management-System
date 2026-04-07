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
<<<<<<< HEAD
router.get('/', protect, authorize('admin', 'faculty'), getFaculties);
=======
router.get('/', protect, authorize('admin'), getFaculties);
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
router.post('/', protect, authorize('admin'), createFaculty);
router.get('/:id', protect, getFaculty);
router.put('/:id', protect, authorize('admin'), updateFaculty);
router.delete('/:id', protect, authorize('admin'), deleteFaculty);

module.exports = router;
