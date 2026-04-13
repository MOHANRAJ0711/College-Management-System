const express = require('express');
const { protect, authorize } = require('../../../middleware/auth');
const {
  getHostels,
  createHostel,
  getRooms,
  createRoom,
  getAllocations,
  requestAllocation,
  updateAllocationStatus,
} = require('../controllers/hostelController');

const router = express.Router();

// --- Hostels ---
router.route('/')
  .get(protect, getHostels)
  .post(protect, authorize('admin'), createHostel);

// --- Rooms ---
router.route('/rooms')
  .get(protect, getRooms)
  .post(protect, authorize('admin'), createRoom);

// --- Allocations ---
router.route('/allocations')
  .get(protect, getAllocations)
  .post(protect, authorize('student'), requestAllocation);

router.route('/allocations/:id')
  .patch(protect, authorize('admin'), updateAllocationStatus);

module.exports = router;
