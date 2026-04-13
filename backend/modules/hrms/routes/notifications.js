const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  createNotification,
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// Broadcast management (admin only)
router.post('/', protect, authorize('admin'), createNotification);

// Read endpoints (all authenticated users)
router.get('/unread-count', protect, getUnreadCount);
router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);

// Mark as read (any user — marks for themselves)
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

// Admin management
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

module.exports = router;
