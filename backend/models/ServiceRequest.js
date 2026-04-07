const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'bonafide',
        'transfer_certificate',
        'course_completion',
        'id_card_reissue',
        'migration_certificate',
        'provisional_certificate',
        'character_certificate',
        'fee_receipt',
        'transcript',
        'other',
      ],
      required: true,
    },
    purpose: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'delivered', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true },
    deliveryDate: { type: Date },
    documentUrl: { type: String },
    urgency: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    copies: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
