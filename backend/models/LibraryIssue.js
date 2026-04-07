const mongoose = require('mongoose');

const libraryIssueSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryBook',
      required: [true, 'Book is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
    },
    fine: {
      type: Number,
      default: 0,
      min: [0, 'Fine cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['issued', 'returned', 'overdue'],
        message: '{VALUE} is not a valid issue status',
      },
      default: 'issued',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LibraryIssue', libraryIssueSchema);
