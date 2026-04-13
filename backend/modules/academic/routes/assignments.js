const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth');
const { uploadSingle } = require('../../../middleware/upload');
const ctrl = require('../controllers/assignmentController');

router.post('/', protect, authorize('faculty'), ctrl.createAssignment);
router.get('/mine', protect, authorize('faculty'), ctrl.getMyAssignments);
router.get('/for-student', protect, authorize('student'), ctrl.getAssignmentsForStudent);
router.put('/:id', protect, authorize('faculty'), ctrl.updateAssignment);
router.delete('/:id', protect, authorize('faculty'), ctrl.deleteAssignment);

module.exports = router;
