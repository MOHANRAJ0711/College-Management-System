const { BusRoute, TransportSubscription } = require('../../../models/Transport');
const Student = require('../../../models/Student');

const transportController = {
  // --- Route Management (Admin) ---
  getRoutes: async (req, res) => {
    try {
      const routes = await BusRoute.find().lean();
      res.status(200).json(routes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  createRoute: async (req, res) => {
    try {
      const route = await BusRoute.create(req.body);
      res.status(201).json(route);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // --- Subscription Management (Admin & Student) ---
  getSubscriptions: async (req, res) => {
    try {
      const subscriptions = await TransportSubscription.find()
        .populate('student', 'user rollNumber')
        .populate('route', 'routeName vehicleNumber stops')
        .lean();
      res.status(200).json(subscriptions);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  subscribeRoute: async (req, res) => {
    try {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      const existing = await TransportSubscription.findOne({ student: student._id });
      if (existing) return res.status(400).json({ message: 'You already have an active transport subscription' });

      const subscription = await TransportSubscription.create({
        student: student._id,
        ...req.body,
        status: 'active',
      });
      res.status(201).json(subscription);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  updateSubscriptionStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const subscription = await TransportSubscription.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      res.status(200).json(subscription);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = transportController;
