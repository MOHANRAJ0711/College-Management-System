const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const handleError = require('../utils/handleError');

const timetablePopulate = [
  { path: 'department', select: 'name code' },
  {
    path: 'periods.course',
    select: 'name code semester credits',
  },
  {
    path: 'periods.faculty',
    select: 'employeeId designation user',
    populate: { path: 'user', select: 'name email' },
  },
];

const createTimetable = async (req, res) => {
  try {
    const entry = await Timetable.create(req.body);
    const populated = await Timetable.findById(entry._id).populate(timetablePopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create timetable entry');
  }
};

const getTimetable = async (req, res) => {
  try {
    const { department, semester, section } = req.query;
    if (!department) {
      return res.status(400).json({ message: 'department query is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const filter = { department };
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (Number.isNaN(s) || s < 1 || s > 8) {
        return res.status(400).json({ message: 'Invalid semester' });
      }
      filter.semester = s;
    }
    if (section) filter.section = section;

    const rows = await Timetable.find(filter).populate(timetablePopulate).sort({ day: 1 });

    return res.status(200).json(rows);
  } catch (err) {
    return handleError(res, err, 'Could not fetch timetable');
  }
};

const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid timetable id' });
    }

    const entry = await Timetable.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate(timetablePopulate);

    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    return res.status(200).json(entry);
  } catch (err) {
    return handleError(res, err, 'Could not update timetable');
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid timetable id' });
    }

    const entry = await Timetable.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    return res.status(200).json({ message: 'Timetable entry removed', id: entry._id });
  } catch (err) {
    return handleError(res, err, 'Could not delete timetable');
  }
};

module.exports = {
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
};
