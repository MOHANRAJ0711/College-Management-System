const express = require('express');
const { protect, admin } = require('../middleware/auth');
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
  .post(protect, admin, createHostel);

// --- Rooms ---
router.route('/rooms')
  .get(protect, getRooms)
  .post(protect, admin, createRoom);

// --- Allocations ---
router.route('/allocations')
  .get(protect, getAllocations)
  .post(protect, requestAllocation);

router.route('/allocations/:id')
  .patch(protect, admin, updateAllocationStatus);

module.exports = router;
