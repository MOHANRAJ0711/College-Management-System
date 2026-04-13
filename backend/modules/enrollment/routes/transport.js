const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  getRoutes,
  createRoute,
  getSubscriptions,
  subscribeRoute,
  updateSubscriptionStatus,
} = require('../controllers/transportController');

const router = express.Router();

// --- Bus Routes ---
router.route('/')
  .get(protect, getRoutes)
  .post(protect, authorize('admin'), createRoute);

// --- Subscriptions ---
router.route('/subscriptions')
  .get(protect, getSubscriptions)
  .post(protect, subscribeRoute);

router.route('/subscriptions/:id')
  .patch(protect, authorize('admin'), updateSubscriptionStatus);

module.exports = router;
