const mongoose = require('mongoose');
const Notification = require('../../../models/Notification');
const Student = require('../../../models/Student');
const Faculty = require('../../../models/Faculty');
const handleError = require('../../../utils/handleError');

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
 * GET /api/notifications
 * Returns broadcast notifications + personal timetable reminders for the requesting user.
 */
const getNotifications = async (req, res) => {
  try {
    const { type, department, targetRole } = req.query;
    const now = new Date();

    const expiryClause = {
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: now } },
      ],
    };

    const role = req.user.role;
    let broadcastFilter = { isActive: true, $and: [expiryClause] };

    if (type) broadcastFilter.type = type;
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      broadcastFilter.department = department;
    }

    if (role === 'student') {
      const studentDoc = await getStudentFromUser(req.user._id);
      broadcastFilter.$and.push({
        $or: [
          { targetRole: 'all' },
          { targetRole: 'student' },
          ...(studentDoc?.department
            ? [{ $and: [{ department: studentDoc.department }, { targetRole: { $ne: 'faculty' } }] }]
            : []),
        ],
      });
      // Students don't have personal timetable reminders
      broadcastFilter.recipient = null;
    } else if (role === 'faculty') {
      const fac = await getFacultyFromUser(req.user._id);
      broadcastFilter.$and.push({
        $or: [
          { targetRole: 'all' },
          { targetRole: 'faculty' },
          ...(fac?.department
            ? [{ $and: [{ department: fac.department }, { targetRole: { $in: ['faculty', 'all'] } }] }]
            : []),
        ],
      });
      // Exclude personal recipient notifications from the broadcast query
      broadcastFilter.recipient = null;
    } else if (role === 'admin') {
      if (targetRole) broadcastFilter.targetRole = targetRole;
      broadcastFilter.recipient = null;
    }

    // Query 1: broadcast notifications
    const broadcastNotes = await Notification.find(broadcastFilter)
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .lean();

    // Query 2: personal timetable reminders for this user
    let personalNotes = [];
    if (role === 'faculty') {
      personalNotes = await Notification.find({
        isActive: true,
        recipient: req.user._id,
        type: 'timetable',
        $and: [expiryClause],
      })
        .populate(notificationPopulate)
        .sort({ createdAt: -1 })
        .lean();
    }

    // Merge: personal first, then broadcasts (deduplicate by _id)
    const seen = new Set();
    const all = [...personalNotes, ...broadcastNotes].filter((n) => {
      const id = n._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Mark which ones the current user has read
    const withReadStatus = all.map((n) => ({
      ...n,
      isRead: (n.readBy || []).some((r) => r.user?.toString() === req.user._id.toString()),
    }));

    return res.status(200).json(withReadStatus);
  } catch (err) {
    return handleError(res, err, 'Could not fetch notifications');
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the current user.
 */
const getUnreadCount = async (req, res) => {
  try {
    const now = new Date();
    const expiryClause = {
      $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }, { expiryDate: { $gt: now } }],
    };

    const userId = req.user._id;

    // Broadcasts
    const broadcastCount = await Notification.countDocuments({
      isActive: true,
      recipient: null,
      targetRole: { $in: ['all', req.user.role] },
      'readBy.user': { $ne: userId },
      $and: [expiryClause],
    });

    // Personal timetable reminders
    let personalCount = 0;
    if (req.user.role === 'faculty') {
      personalCount = await Notification.countDocuments({
        isActive: true,
        recipient: userId,
        type: 'timetable',
        'readBy.user': { $ne: userId },
        $and: [expiryClause],
      });
    }

    return res.status(200).json({ unread: broadcastCount + personalCount });
  } catch (err) {
    return handleError(res, err, 'Could not get unread count');
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read by the current user.
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const note = await Notification.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          readBy: { user: req.user._id, readAt: new Date() },
        },
      },
      { new: true }
    ).populate(notificationPopulate);

    if (!note) return res.status(404).json({ message: 'Notification not found' });
    return res.status(200).json(note);
  } catch (err) {
    return handleError(res, err, 'Could not mark as read');
  }
};

/**
 * PUT /api/notifications/mark-all-read
 * Mark all of the current user's notifications as read.
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    await Notification.updateMany(
      {
        isActive: true,
        'readBy.user': { $ne: userId },
        $or: [
          { recipient: userId },
          { recipient: null, targetRole: { $in: ['all', req.user.role] } },
        ],
      },
      {
        $addToSet: { readBy: { user: userId, readAt: now } },
      }
    );

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    return handleError(res, err, 'Could not mark all as read');
  }
};

const getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }
    const note = await Notification.findById(id).populate(notificationPopulate);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
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
    if (!note) return res.status(404).json({ message: 'Notification not found' });
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
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    return res.status(200).json({ message: 'Notification removed', id: note._id });
  } catch (err) {
    return handleError(res, err, 'Could not delete notification');
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
};
