const mongoose = require('mongoose');

const libraryBookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    edition: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    totalCopies: {
      type: Number,
      default: 1,
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: [0, 'Available copies cannot be negative'],
    },
    shelfLocation: {
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

libraryBookSchema.pre('validate', function (next) {
  if (this.availableCopies > this.totalCopies) {
    this.invalidate(
      'availableCopies',
      'Available copies cannot exceed total copies'
    );
  }
  next();
});

module.exports = mongoose.model('LibraryBook', libraryBookSchema);
