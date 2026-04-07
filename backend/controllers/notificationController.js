const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const handleError = require('../utils/handleError');

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

async function getFacultyFromUser(userId) {
  return Faculty.findOne({ user: userId });
}

const notificationPopulate = [
  { path: 'department', select: 'name code' },
  { path: 'createdBy', select: 'name email role' },
];

const createNotification = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id,
    };
    const note = await Notification.create(payload);
    const populated = await Notification.findById(note._id).populate(notificationPopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create notification');
  }
};

/**
 * Filters by expiry and role/department visibility.
 */
const getNotifications = async (req, res) => {
  try {
    const { type, department, targetRole } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: 'Invalid department id' });
      }
      filter.department = department;
    }

    const now = new Date();
    const expiryClause = {
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: now } },
      ],
    };

    const andParts = [expiryClause];

    const role = req.user.role;
    if (role === 'student') {
      const studentDoc = await getStudentFromUser(req.user._id);
      const visibility = {
        $or: [
          { targetRole: 'all' },
          { targetRole: 'student' },
          ...(studentDoc?.department
            ? [{ $and: [{ department: studentDoc.department }, { targetRole: { $ne: 'faculty' } }] }]
            : []),
        ],
      };
      andParts.push(visibility);
    } else if (role === 'faculty') {
      const fac = await getFacultyFromUser(req.user._id);
      const visibility = {
        $or: [
          { targetRole: 'all' },
          { targetRole: 'faculty' },
          ...(fac?.department
            ? [{ $and: [{ department: fac.department }, { targetRole: { $in: ['faculty', 'all'] } }] }]
            : []),
        ],
      };
      andParts.push(visibility);
    } else if (role === 'admin') {
      if (targetRole) filter.targetRole = targetRole;
    }

    filter.$and = andParts;

    const notes = await Notification.find(filter)
      .populate(notificationPopulate)
      .sort({ createdAt: -1 });

    return res.status(200).json(notes);
  } catch (err) {
    return handleError(res, err, 'Could not fetch notifications');
  }
};

const getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const note = await Notification.findById(id).populate(notificationPopulate);

    if (!note) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json(note);
  } catch (err) {
    return handleError(res, err, 'Could not fetch notification');
  }
};

const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const note = await Notification.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate(notificationPopulate);

    if (!note) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json(note);
  } catch (err) {
    return handleError(res, err, 'Could not update notification');
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const note = await Notification.findByIdAndDelete(id);
    if (!note) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Notification removed', id: note._id });
  } catch (err) {
    return handleError(res, err, 'Could not delete notification');
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
};
