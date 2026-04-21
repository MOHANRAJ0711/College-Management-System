const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateProfileImage,
  removeProfileImage,
  updateUserAvatar,
  removeUserAvatar,
  verifyOTP,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../../../middleware/auth');
const { uploadSingle } = require('../../../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile-image', protect, uploadSingle('photo'), updateProfileImage);
router.delete('/profile-image', protect, removeProfileImage);
router.put('/change-password', protect, changePassword);

// Delegated Avatar Management (Admin only)
router.put('/users/:userId/avatar', protect, authorize('admin'), uploadSingle('photo'), updateUserAvatar);
router.delete('/users/:userId/avatar', protect, authorize('admin'), removeUserAvatar);

module.exports = router;
