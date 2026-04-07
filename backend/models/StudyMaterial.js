const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course', // Mapping to existing Course model which represents subjects in this ERP
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'ppt', 'doc', 'link'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    description: String,
    targetYear: Number,
    targetSemester: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
