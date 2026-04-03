const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['internal', 'semester', 'supplementary'],
        message: '{VALUE} is not a valid exam type',
      },
      required: [true, 'Exam type is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [0, 'Total marks cannot be negative'],
    },
    passingMarks: {
      type: Number,
      min: [0, 'Passing marks cannot be negative'],
    },
    room: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid exam status',
      },
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
