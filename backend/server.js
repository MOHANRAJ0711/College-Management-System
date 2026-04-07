const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/results', require('./routes/results'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/admissions', require('./routes/admissions'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/library', require('./routes/library'));
app.use('/api/placements', require('./routes/placements'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/dashboard', require('./routes/dashboard'));
<<<<<<< HEAD
app.use('/api/hostel', require('./routes/hostel'));
app.use('/api/transport', require('./routes/transport'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/lms', require('./routes/lms'));
app.use('/api/lifecycle', require('./routes/lifecycle'));
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
app.use('/api/result-upload', require('./routes/resultUpload'));
app.use('/api/face-attendance', require('./routes/faceAttendance'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/student-documents', require('./routes/studentDocuments'));
app.use('/api/hod', require('./routes/hod'));

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
