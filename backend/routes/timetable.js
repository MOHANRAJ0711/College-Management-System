const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
} = require('../controllers/timetableController');

const router = express.Router();

router.post('/', protect, authorize('admin', 'faculty'), createTimetable);
router.get('/', protect, getTimetable);
router.put('/:id', protect, authorize('admin', 'faculty'), updateTimetable);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteTimetable);

module.exports = router;
