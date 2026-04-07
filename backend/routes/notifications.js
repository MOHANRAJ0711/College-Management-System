const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/', protect, authorize('admin'), createNotification);
router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

module.exports = router;
