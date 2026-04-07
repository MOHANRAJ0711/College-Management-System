const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['boys', 'girls', 'unisex'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    contactPhone: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hostel', hostelSchema);
