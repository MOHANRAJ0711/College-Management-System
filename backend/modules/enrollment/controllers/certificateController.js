const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Certificate = require('../../../models/Certificate');
const Student = require('../../../models/Student');
const { generateCertificatePDF } = require('../../../utils/generatePDF');
const handleError = require('../../../utils/handleError');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'certificates');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

async function generateUniqueCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${year}-${suffix}`;
}

const TYPE_LABELS = {
  degree: 'Degree',
  provisional: 'Provisional',
  migration: 'Migration',
  character: 'Character',
  bonafide: 'Bonafide',
};

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

const certificatePopulate = [
  {
    path: 'student',
    select: 'rollNumber registrationNumber user course department',
    populate: { path: 'user', select: 'name email' },
  },
  { path: 'generatedBy', select: 'name email' },
];

const generateCertificate = async (req, res) => {
  try {
    const { student, type, issueDate, data } = req.body;
    if (!student || !type) {
      return res.status(400).json({ message: 'student and type are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const studentDoc = await Student.findById(student)
      .populate('user', 'name email')
      .populate('course', 'name code');

    if (!studentDoc) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const certificateNumber = await generateUniqueCertificateNumber();

    const cert = await Certificate.create({
      student,
      type,
      certificateNumber,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      data: data || {},
      generatedBy: req.user._id,
      status: 'generated',
    });

    const programName =
      (studentDoc.course && studentDoc.course.name) || data?.program || '';

    const pdfBuffer = await generateCertificatePDF({
      studentName: studentDoc.user?.name || data?.studentName || 'Student',
      studentId: studentDoc.rollNumber || '',
      program: programName,
      certificateType: TYPE_LABELS[type] || type,
      certificateNumber,
      issuedDate: cert.issueDate,
    });

    ensureUploadsDir();
    const filename = `${cert._id}.pdf`;
    const absPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(absPath, pdfBuffer);

    const pdfUrl = `/uploads/certificates/${filename}`;
    cert.pdfUrl = pdfUrl;
    await cert.save();

    const populated = await Certificate.findById(cert._id).populate(certificatePopulate);

    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not generate certificate');
  }
};

const getCertificates = async (req, res) => {
  try {
    const { type, status, student } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      filter.student = student;
    }

    const rows = await Certificate.find(filter).populate(certificatePopulate).sort({ issueDate: -1 });

    return res.status(200).json(rows);
  } catch (err) {
    return handleError(res, err, 'Could not fetch certificates');
  }
};

const getStudentCertificates = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const rows = await Certificate.find({ student: studentDoc._id })
      .populate('generatedBy', 'name email')
      .sort({ issueDate: -1 });

    return res.status(200).json(rows);
  } catch (err) {
    return handleError(res, err, 'Could not fetch your certificates');
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid certificate id' });
    }

    const cert = await Certificate.findById(id);
    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (!cert.pdfUrl) {
      return res.status(404).json({ message: 'PDF not generated for this certificate' });
    }

    if (req.user.role === 'student') {
      const studentDoc = await getStudentFromUser(req.user._id);
      if (!studentDoc || !cert.student.equals(studentDoc._id)) {
        return res.status(403).json({ message: 'Not authorized to download this certificate' });
      }
    }

    const relative = cert.pdfUrl.replace(/^\/uploads\//, '');
    const absPath = path.join(__dirname, '..', 'uploads', relative);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'Certificate file missing on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateNumber || id}.pdf"`);
    return res.sendFile(absPath);
  } catch (err) {
    return handleError(res, err, 'Could not download certificate');
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    if (!certificateNumber) {
      return res.status(400).json({ message: 'Certificate number is required' });
    }

    const cert = await Certificate.findOne({ certificateNumber: certificateNumber.trim() })
      .populate('student', 'rollNumber registrationNumber')
      .select('type certificateNumber issueDate status student data');

    if (!cert) {
      return res.status(404).json({ valid: false, message: 'Certificate not found' });
    }

    return res.status(200).json({
      valid: true,
      certificateNumber: cert.certificateNumber,
      type: cert.type,
      issueDate: cert.issueDate,
      status: cert.status,
      student: cert.student,
    });
  } catch (err) {
    return handleError(res, err, 'Could not verify certificate');
  }
};

module.exports = {
  generateCertificate,
  getCertificates,
  getStudentCertificates,
  downloadCertificate,
  verifyCertificate,
};
