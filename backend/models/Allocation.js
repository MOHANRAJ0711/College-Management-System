const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    allocationDate: {
      type: Date,
      default: Date.now,
    },
    checkoutDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['requested', 'allocated', 'occupied', 'vacated'],
      default: 'requested',
    },
    messPreference: {
      type: String,
      enum: ['veg', 'non-veg'],
      default: 'veg',
    },
    feeStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially-paid'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Allocation', allocationSchema);
