const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
} = require('../controllers/timetableController');

const router = express.Router();

<<<<<<< HEAD
router.post('/', protect, authorize('admin', 'faculty'), createTimetable);
router.get('/', protect, getTimetable);
router.put('/:id', protect, authorize('admin', 'faculty'), updateTimetable);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteTimetable);
=======
router.post('/', protect, authorize('admin'), createTimetable);
router.get('/', protect, getTimetable);
router.put('/:id', protect, authorize('admin'), updateTimetable);
router.delete('/:id', protect, authorize('admin'), deleteTimetable);
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09

module.exports = router;
