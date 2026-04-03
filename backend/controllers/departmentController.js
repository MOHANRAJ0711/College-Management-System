const mongoose = require('mongoose');
const Department = require('../models/Department');

const handleError = (res, err, defaultMsg = 'Server error') => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }
  console.error(err);
  return res.status(500).json({ message: defaultMsg });
};

/**
 * GET — list departments (public)
 */
const getDepartments = async (req, res) => {
  try {
    const { includeInactive, search } = req.query;
    const filter = {};

    if (includeInactive !== 'true' && includeInactive !== '1') {
      filter.isActive = true;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const departments = await Department.find(filter)
      .populate('hod', 'employeeId designation')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json(departments);
  } catch (err) {
    return handleError(res, err, 'Could not fetch departments');
  }
};

/**
 * GET /:id — single department (public)
 */
const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const department = await Department.findById(id).populate('hod', 'employeeId designation').lean();
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json(department);
  } catch (err) {
    return handleError(res, err, 'Could not fetch department');
  }
};

/**
 * POST — admin
 */
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, hod, establishedYear, isActive } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Please provide name and code' });
    }

    const department = await Department.create({
      name,
      code,
      description,
      hod,
      establishedYear,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await Department.findById(department._id).populate('hod', 'employeeId designation');
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create department');
  }
};

/**
 * PUT /:id — admin
 */
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const allowed = ['name', 'code', 'description', 'hod', 'establishedYear', 'isActive'];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const department = await Department.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate('hod', 'employeeId designation');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json(department);
  } catch (err) {
    return handleError(res, err, 'Could not update department');
  }
};

/**
 * DELETE /:id — admin (soft delete)
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.status(200).json({ message: 'Department deactivated', department });
  } catch (err) {
    return handleError(res, err, 'Could not delete department');
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
