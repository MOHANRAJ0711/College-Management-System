const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/auth');
const { uploadSingle } = require('../../../middleware/upload');
const ctrl = require('../controllers/faceAttendanceController');

router.post(
  '/register',
  protect,
  authorize('student'),
  uploadSingle('photo'),
  ctrl.registerFace
);

router.get(
  '/my-status',
  protect,
  authorize('student'),
  ctrl.getMyFaceStatus
);

router.get(
  '/class-descriptors',
  protect,
  authorize('faculty', 'admin'),
  ctrl.getClassDescriptors
);

router.post(
  '/save-attendance',
  protect,
  authorize('faculty', 'admin'),
  ctrl.saveFaceAttendance
);

module.exports = router;
