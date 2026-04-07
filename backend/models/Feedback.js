const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Remains anonymous in some views, but stored for uniqueness
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    ratings: {
      teaching: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      support: { type: Number, min: 1, max: 5 },
    },
    comment: String,
    semester: Number,
    academicYear: String,
  },
  { timestamps: true }
);

// Ensure a student only gives feedback for a subject/faculty once per semester
feedbackSchema.index({ student: 1, faculty: 1, subject: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
