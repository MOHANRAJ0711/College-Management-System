const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getSubscriptions,
  subscribeRoute,
  updateSubscriptionStatus,
} = require('../controllers/transportController');

const router = express.Router();

// --- Bus Routes ---
router.route('/')
  .get(protect, getRoutes)
  .post(protect, authorize('admin'), createRoute);

router.route('/:id')
  .patch(protect, authorize('admin'), updateRoute)
  .delete(protect, authorize('admin'), deleteRoute);

// --- Subscriptions ---
router.route('/subscriptions')
  .get(protect, getSubscriptions)
  .post(protect, subscribeRoute);

router.route('/subscriptions/:id')
  .patch(protect, authorize('admin'), updateSubscriptionStatus);

module.exports = router;
