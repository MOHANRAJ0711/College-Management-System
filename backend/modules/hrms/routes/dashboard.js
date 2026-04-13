const express = require('express');
const { getAdminDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../../../middleware/auth');

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
