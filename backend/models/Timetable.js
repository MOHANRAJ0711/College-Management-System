const mongoose = require('mongoose');

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const periodSchema = new mongoose.Schema(
  {
    periodNumber: {
      type: Number,
      required: [true, 'Period number is required'],
      min: [1, 'Period number must be at least 1'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    room: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    section: {
      type: String,
      trim: true,
    },
    day: {
      type: String,
      enum: {
        values: WEEKDAYS,
        message: '{VALUE} is not a valid weekday',
      },
      required: [true, 'Day is required'],
    },
    periods: [periodSchema],
    academicYear: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, semester: 1, section: 1, day: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
