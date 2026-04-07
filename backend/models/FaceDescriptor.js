const mongoose = require('mongoose');

const faceDescriptorSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    descriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => v.length === 128,
        message: 'Face descriptor must be a 128-dimensional vector',
      },
    },
    photoPath: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

faceDescriptorSchema.index({ student: 1 }, { unique: true });
faceDescriptorSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('FaceDescriptor', faceDescriptorSchema);
