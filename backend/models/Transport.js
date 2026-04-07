const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      unique: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
    },
    driverName: String,
    driverPhone: String,
    capacity: {
      type: Number,
      required: true,
    },
    stops: [
      {
        name: { type: String, required: true },
        time: { type: String, required: true }, // Format HH:mm
      },
    ],
    fee: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const transportSubscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusRoute',
      required: true,
    },
    stop: {
      type: String,
      required: true,
    },
    subscriptionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially-paid'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const BusRoute = mongoose.model('BusRoute', busRouteSchema);
const TransportSubscription = mongoose.model('TransportSubscription', transportSubscriptionSchema);

module.exports = { BusRoute, TransportSubscription };
