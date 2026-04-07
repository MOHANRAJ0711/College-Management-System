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
        values: [
          'general',
          'academic',
          'exam',
          'fee',
          'placement',
          'event',
        ],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
