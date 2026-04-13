const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
} = require('../controllers/timetableController');

const router = express.Router();

// Admin or faculty (HOD) can create/update/delete timetable entries
// The controller's verifyHodAccess function enforces that faculty must be HOD
router.post('/', protect, authorize('admin', 'faculty'), createTimetable);
router.get('/', protect, getTimetable);
router.put('/:id', protect, authorize('admin', 'faculty'), updateTimetable);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteTimetable);

module.exports = router;
