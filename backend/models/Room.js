const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['single', 'double', 'triple', 'suite'],
      default: 'double',
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1'],
    },
    occupiedCount: {
      type: Number,
      default: 0,
    },
    amenities: [String],
    isFull: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-update isFull status
roomSchema.pre('save', function (next) {
  this.isFull = this.occupiedCount >= this.capacity;
  next();
});

module.exports = mongoose.model('Room', roomSchema);
