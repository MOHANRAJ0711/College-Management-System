const express = require('express');
const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyDashboard,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../../../middleware/auth');

const router = express.Router();

// Faculty dashboard — logged-in faculty only
router.get('/dashboard', protect, authorize('faculty'), getFacultyDashboard);

// List all faculty — admin sees all; faculty role (HOD) sees their department
router.get('/', protect, authorize('admin', 'faculty'), getFaculties);

// Create faculty — admin only
router.post('/', protect, authorize('admin'), createFaculty);

// Get single faculty — any authenticated user (controller enforces own-record for faculty role)
router.get('/:id', protect, getFaculty);

// Update / delete — admin only
router.put('/:id', protect, authorize('admin'), updateFaculty);
router.delete('/:id', protect, authorize('admin'), deleteFaculty);

module.exports = router;
