const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/hodController');

router.get('/dashboard', protect, authorize('faculty'), ctrl.getDashboard);
router.get('/faculty', protect, authorize('faculty'), ctrl.getDeptFaculty);
router.get('/students', protect, authorize('faculty'), ctrl.getDeptStudents);
router.get('/courses', protect, authorize('faculty'), ctrl.getDeptCourses);
router.post('/assign-subject', protect, authorize('faculty'), ctrl.assignSubject);
router.post('/notify', protect, authorize('faculty'), ctrl.sendDeptNotification);

module.exports = router;
