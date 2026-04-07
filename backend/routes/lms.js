const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  uploadMaterial,
  getMaterials,
  submitFeedback,
  getFacultyRatings,
} = require('../controllers/lmsController');

const router = express.Router();

// --- Study Materials ---
router.route('/materials')
  .get(protect, getMaterials)
  .post(protect, uploadMaterial);

// --- Faculty Feedback ---
router.route('/feedback')
  .post(protect, submitFeedback);

router.get('/ratings/:facultyId', protect, getFacultyRatings);

module.exports = router;
