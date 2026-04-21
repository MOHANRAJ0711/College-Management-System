const User = require('../../../models/User');
const Student = require('../../../models/Student');
const Faculty = require('../../../models/Faculty');
const FaceDescriptor = require('../../../models/FaceDescriptor');
const generateToken = require('../../../utils/generateToken');
const sendEmail = require('../../../utils/sendEmail');
const crypto = require('crypto');

const populateUserProfile = async (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  if (user.role === 'student') {
    user.studentProfile = await Student.findOne({ user: user._id })
      .populate('department', 'name code')
      .populate('course', 'name code semester department')
      .lean();
  } else if (user.role === 'faculty') {
    user.facultyProfile = await Faculty.findOne({ user: user._id })
      .populate('department', 'name code')
      .populate('subjects', 'name code semester credits type')
      .lean();
    user.isHOD = user.facultyProfile?.designation === 'HOD';
  }
  return user;
};

const handleError = (res, err, defaultMsg = 'Server error') => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }
  console.error(err);
  return res.status(500).json({ message: defaultMsg });
};

/**
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, studentProfile, facultyProfile } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (role === 'student') {
      if (!studentProfile || !studentProfile.rollNumber) {
        return res.status(400).json({ message: 'Student profile with rollNumber is required' });
      }
      const user = await User.create({
        name,
        email,
        password,
        role: 'student',
      });

      await Student.create({
        user: user._id,
        rollNumber: studentProfile.rollNumber,
        registrationNumber: studentProfile.registrationNumber,
        department: studentProfile.department || undefined,
        course: studentProfile.course || undefined,
        semester: studentProfile.semester,
        section: studentProfile.section,
        batch: studentProfile.batch,
        dateOfBirth: studentProfile.dateOfBirth,
        gender: studentProfile.gender,
        phone: studentProfile.phone,
        address: studentProfile.address,
        guardianName: studentProfile.guardianName,
        guardianPhone: studentProfile.guardianPhone,
        bloodGroup: studentProfile.bloodGroup,
        admissionDate: studentProfile.admissionDate,
      });

      const token = generateToken(user._id);
      const payload = await populateUserProfile(await User.findById(user._id));
      return res.status(201).json({ token, user: payload });
    }

    if (role === 'faculty') {
      if (!facultyProfile || !facultyProfile.employeeId) {
        return res.status(400).json({ message: 'Faculty profile with employeeId is required' });
      }
      const user = await User.create({
        name,
        email,
        password,
        role: 'faculty',
      });

      await Faculty.create({
        user: user._id,
        employeeId: facultyProfile.employeeId,
        department: facultyProfile.department || undefined,
        designation: facultyProfile.designation,
        qualification: facultyProfile.qualification,
        specialization: facultyProfile.specialization,
        experience: facultyProfile.experience,
        phone: facultyProfile.phone,
        address: facultyProfile.address,
        dateOfJoining: facultyProfile.dateOfJoining,
        subjects: facultyProfile.subjects || [],
      });

      const token = generateToken(user._id);
      const payload = await populateUserProfile(await User.findById(user._id));
      return res.status(201).json({ token, user: payload });
    }

    if (role === 'admin') {
      const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
      });
      const token = generateToken(user._id);
      const u = user.toObject();
      delete u.password;
      return res.status(201).json({ token, user: u });
    }

    return res.status(400).json({ message: 'Invalid role for registration' });
  } catch (err) {
    return handleError(res, err, 'Could not register user');
  }
};

/**
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Login OTP - CampusOne',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #4f46e5; text-align: center;">Welcome to CampusOne</h2>
            <p>Your one-time password for logging in is:</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      return res.status(200).json({ 
        otpRequired: true, 
        email: user.email,
        message: 'OTP sent to your email' 
      });
    } catch (err) {
      user.loginOtp = undefined;
      user.loginOtpExpire = undefined;
      await user.save();
      console.error('Email error:', err);
      return res.status(500).json({ message: 'Could not send OTP email' });
    }
  } catch (err) {
    return handleError(res, err, 'Could not login');
  }
};

/**
 * @route POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      loginOtp: otp,
      loginOtpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    const payload = await populateUserProfile(await User.findById(user._id));
    return res.status(200).json({ token, user: payload });
  } catch (err) {
    return handleError(res, err, 'OTP verification failed');
  }
};

/**
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal that the user does not exist
      return res.status(200).json({ message: 'Email sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    // For frontend, we usually redirect to the frontend domain. 
    // Assuming development or relative path? Better to construct based on Origin header or fixed config.
    const frontendUrl = req.get('origin') || `${req.protocol}://${req.get('host').replace(':5000', ':5173')}`;
    const fullResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) have requested the reset of a password for your account.</p>
        <p>Please click on the button below to reset your password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${fullResetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">Link valid for 15 minutes. If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Recovery - CampusOne',
        html: message,
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    return handleError(res, err, 'Forgot password process failed');
  }
};

/**
 * @route POST /api/auth/reset-password/:resetToken
 */
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    return handleError(res, err, 'Password reset failed');
  }
};

/**
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await populateUserProfile(req.user);
    return res.status(200).json(user);
  } catch (err) {
    return handleError(res, err, 'Could not load profile');
  }
};

/**
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar, studentProfile, facultyProfile } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    if (user.role === 'student' && studentProfile && typeof studentProfile === 'object') {
      const allowed = [
        'registrationNumber',
        'department',
        'course',
        'semester',
        'section',
        'batch',
        'dateOfBirth',
        'gender',
        'phone',
        'address',
        'guardianName',
        'guardianPhone',
        'bloodGroup',
        'admissionDate',
      ];
      const update = {};
      allowed.forEach((k) => {
        if (studentProfile[k] !== undefined) update[k] = studentProfile[k];
      });
      if (Object.keys(update).length) {
        const student = await Student.findOne({ user: user._id });
        if (student) {
          Object.assign(student, update);

          // Evaluate profile completion
          const reqStudentFields = ['dateOfBirth', 'gender', 'phone', 'guardianName', 'guardianPhone'];
          const reqAddressFields = ['street', 'city', 'state', 'pincode'];
          
          let isComplete = true;
          for (const f of reqStudentFields) {
            if (!student[f]) {
              isComplete = false;
              break;
            }
          }
          if (isComplete && (!student.address || reqAddressFields.some((f) => !student.address[f]))) {
            isComplete = false;
          }
          
          student.isProfileComplete = isComplete;
          await student.save();
        }
      }
    }

    if (user.role === 'faculty' && facultyProfile && typeof facultyProfile === 'object') {
      const allowed = [
        'department',
        'designation',
        'qualification',
        'specialization',
        'experience',
        'phone',
        'address',
        'dateOfJoining',
        'subjects',
      ];
      const update = {};
      allowed.forEach((k) => {
        if (facultyProfile[k] !== undefined) update[k] = facultyProfile[k];
      });
      if (Object.keys(update).length) {
        await Faculty.findOneAndUpdate({ user: user._id }, update, {
          new: true,
          runValidators: true,
        });
      }
    }

    const payload = await populateUserProfile(await User.findById(user._id));
    return res.status(200).json(payload);
  } catch (err) {
    return handleError(res, err, 'Could not update profile');
  }
};

/**
 * @route PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide currentPassword and newPassword' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ok = await user.matchPassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return handleError(res, err, 'Could not change password');
  }
};

const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const photoPath = `/uploads/${req.file.filename}`;
    user.avatar = photoPath;
    await user.save();

    // If user is a student, sync face descriptor
    if (user.role === 'student') {
      let { descriptor } = req.body;
      if (descriptor) {
        if (typeof descriptor === 'string') {
          try {
            descriptor = JSON.parse(descriptor);
          } catch {
            return res.status(400).json({ message: 'Invalid descriptor format' });
          }
        }

        const student = await Student.findOne({ user: user._id });
        if (student) {
          const existing = await FaceDescriptor.findOne({ student: student._id });
          if (existing) {
            existing.descriptor = descriptor;
            existing.photoPath = photoPath;
            await existing.save();
          } else {
            await FaceDescriptor.create({
              student: student._id,
              user: user._id,
              descriptor,
              photoPath,
            });
          }
        }
      }
    }

    const payload = await populateUserProfile(await User.findById(user._id));
    return res.status(200).json({
      message: 'Profile image updated successfully',
      user: payload,
    });
  } catch (err) {
    return handleError(res, err, 'Could not update profile image');
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = '';
    await user.save();

    const payload = await populateUserProfile(user);
    return res.status(200).json({
      message: 'Profile image removed',
      user: payload,
    });
  } catch (err) {
    return handleError(res, err, 'Could not remove profile image');
  }
};

const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findById(req.params.userId || req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      message: 'User avatar updated',
      avatar: user.avatar,
    });
  } catch (err) {
    return handleError(res, err, 'Could not update user avatar');
  }
};

const removeUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId || req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = '';
    await user.save();

    return res.status(200).json({
      message: 'User avatar removed',
    });
  } catch (err) {
    return handleError(res, err, 'Could not remove user avatar');
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateProfileImage,
  removeProfileImage,
  updateUserAvatar,
  removeUserAvatar,
  changePassword,
  verifyOTP,
  forgotPassword,
  resetPassword,
};
