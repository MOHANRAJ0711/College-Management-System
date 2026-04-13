const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateProfileImage,
} = require('../controllers/authController');
const { protect } = require('../../../middleware/auth');
const { uploadSingle } = require('../../../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile-image', protect, uploadSingle('photo'), updateProfileImage);
router.put('/change-password', protect, changePassword);

module.exports = router;
