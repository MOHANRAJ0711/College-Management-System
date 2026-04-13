const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['general', 'academic', 'exam', 'fee', 'placement', 'event', 'timetable'],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'general',
    },
    targetRole: {
      type: String,
      enum: {
        values: ['all', 'student', 'faculty', 'admin'],
        message: '{VALUE} is not a valid target role',
      },
      default: 'all',
    },
    // Individual recipient — for personal notifications like class reminders
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Track who has read this notification
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
    // Metadata for timetable reminders to avoid duplicates
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fast per-user notification queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
