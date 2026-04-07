const FaceDescriptor = require('../models/FaceDescriptor');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const handleError = require('../utils/handleError');

exports.registerFace = async (req, res) => {
  try {
    let { descriptor } = req.body;
    if (typeof descriptor === 'string') {
      try {
        descriptor = JSON.parse(descriptor);
      } catch {
        return res.status(400).json({ message: 'Invalid descriptor format' });
      }
    }
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Valid 128-dim face descriptor is required' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Face photo is required' });
    }

    const photoPath = `/uploads/${req.file.filename}`;

    const existing = await FaceDescriptor.findOne({ student: student._id });
    if (existing) {
      existing.descriptor = descriptor;
      existing.photoPath = photoPath;
      await existing.save();
      return res.json({ message: 'Face updated successfully', face: existing });
    }

    const face = await FaceDescriptor.create({
      student: student._id,
      user: req.user._id,
      descriptor,
      photoPath,
    });

    res.status(201).json({ message: 'Face registered successfully', face });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMyFaceStatus = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.json({ registered: false });
    }
    const face = await FaceDescriptor.findOne({ student: student._id });
    res.json({
      registered: Boolean(face),
      photoPath: face?.photoPath ?? null,
      updatedAt: face?.updatedAt ?? null,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getClassDescriptors = async (req, res) => {
  try {
    const { department, semester, section } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = section;

    const students = await Student.find(filter)
      .populate('user', 'name email')
      .populate('department', 'name code');

    const studentIds = students.map((s) => s._id);
    const faces = await FaceDescriptor.find({ student: { $in: studentIds } });
    const faceMap = new Map(faces.map((f) => [f.student.toString(), f]));

    const result = students.map((s) => ({
      studentId: s._id,
      userId: s.user?._id,
      rollNumber: s.rollNumber,
      name: s.user?.name ?? 'Unknown',
      department: s.department?.name ?? '',
      semester: s.semester,
      section: s.section,
      registered: faceMap.has(s._id.toString()),
      descriptor: faceMap.get(s._id.toString())?.descriptor ?? null,
      photoPath: faceMap.get(s._id.toString())?.photoPath ?? null,
    }));

    res.json({ students: result, total: result.length });
  } catch (err) {
    handleError(res, err);
  }
};

exports.saveFaceAttendance = async (req, res) => {
  try {
    const { courseId, date, semester, records } = req.body;

    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'courseId, date, and records[] are required' });
    }

    const faculty = await Faculty.findOne({ user: req.user._id });

    const ops = records.map((r) => ({
      updateOne: {
        filter: { student: r.studentId, course: courseId, date: new Date(date) },
        update: {
          $set: {
            status: r.status,
            faculty: faculty?._id,
            semester: semester ? Number(semester) : undefined,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    res.json({
      message: 'Attendance saved successfully',
      summary: {
        total: records.length,
        present: presentCount,
        absent: absentCount,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};
