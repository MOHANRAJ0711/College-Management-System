const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
<<<<<<< HEAD
const { uploadSingle } = require('../middleware/upload');
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
<<<<<<< HEAD
router.put('/profile-image', protect, uploadSingle('photo'), updateProfileImage);
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
router.put('/change-password', protect, changePassword);

module.exports = router;
