const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  applyScholarship,
  getScholarships,
  updateScholarshipStatus,
  bookEvent,
  getEvents,
  updateEventStatus,
} = require('../controllers/lifecycleController');

const router = express.Router();

// --- Scholarships ---
router.route('/scholarship')
  .get(protect, getScholarships)
  .post(protect, applyScholarship);

router.patch('/scholarship/:id', protect, authorize('admin'), updateScholarshipStatus);

// --- Events ---
router.route('/event')
  .get(protect, getEvents)
  .post(protect, bookEvent);

router.patch('/event/:id', protect, authorize('admin'), updateEventStatus);

module.exports = router;
