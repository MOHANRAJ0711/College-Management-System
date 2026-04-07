const express = require('express');
const { protect, admin } = require('../middleware/auth');
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
  .post(protect, admin, createRoute);

// --- Subscriptions ---
router.route('/subscriptions')
  .get(protect, getSubscriptions)
  .post(protect, subscribeRoute);

router.route('/subscriptions/:id')
  .patch(protect, admin, updateSubscriptionStatus);

module.exports = router;
