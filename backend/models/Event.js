const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'organizerModel',
      required: true,
    },
    organizerModel: {
      type: String,
      enum: ['Faculty', 'Student'],
      required: true,
    },
    type: {
      type: String,
      enum: ['seminar', 'workshop', 'cultural', 'sports', 'webinar', 'other'],
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    capacity: Number,
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
