const Hostel = require('../../../models/Hostel');
const Room = require('../../../models/Room');
const Allocation = require('../../../models/Allocation');
const Student = require('../../../models/Student');

const hostelController = {
  // --- Hostel Management (Admin) ---
  getHostels: async (req, res) => {
    try {
      const hostels = await Hostel.find().populate('warden', 'user').lean();
      res.status(200).json(hostels);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  createHostel: async (req, res) => {
    try {
      const hostel = await Hostel.create(req.body);
      res.status(201).json(hostel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // --- Room Management (Admin) ---
  getRooms: async (req, res) => {
    try {
      const { hostelId } = req.query;
      const filter = hostelId ? { hostel: hostelId } : {};
      const rooms = await Room.find(filter).populate('hostel', 'name').lean();
      res.status(200).json(rooms);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  createRoom: async (req, res) => {
    try {
      const room = await Room.create(req.body);
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // --- Allocation Management (Admin & Student) ---
  getAllocations: async (req, res) => {
    try {
      const allocations = await Allocation.find()
        .populate('student', 'user rollNumber')
        .populate('hostel', 'name')
        .populate('room', 'roomNumber')
        .lean();
      res.status(200).json(allocations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  requestAllocation: async (req, res) => {
    try {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      const existing = await Allocation.findOne({ student: student._id });
      if (existing) return res.status(400).json({ message: 'You already have a hostel allocation or request' });

      const allocation = await Allocation.create({
        student: student._id,
        ...req.body,
        status: 'requested',
      });
      res.status(201).json(allocation);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  updateAllocationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, roomId } = req.body;
      
      const allocation = await Allocation.findById(id);
      if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

      if (status === 'allocated' && roomId) {
        const room = await Room.findById(roomId);
        if (!room || room.isFull) return res.status(400).json({ message: 'Room is full or not found' });

        // Update room count
        room.occupiedCount += 1;
        await room.save();
        allocation.room = roomId;
      }

      allocation.status = status;
      await allocation.save();
      res.status(200).json(allocation);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = hostelController;
