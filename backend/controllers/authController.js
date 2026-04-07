const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const FaceDescriptor = require('../models/FaceDescriptor');
const generateToken = require('../utils/generateToken');

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

    const token = generateToken(user._id);
    const payload = await populateUserProfile(await User.findById(user._id));
    return res.status(200).json({ token, user: payload });
  } catch (err) {
    return handleError(res, err, 'Could not login');
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
        await Student.findOneAndUpdate({ user: user._id }, update, {
          new: true,
          runValidators: true,
        });
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

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateProfileImage,
  changePassword,
};
