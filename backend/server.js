const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startTimetableNotifier } = require('./utils/timetableNotifier');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', require('./modules/enrollment/routes/auth'));
app.use('/api/students', require('./modules/enrollment/routes/students'));
app.use('/api/faculty', require('./modules/hrms/routes/faculty'));
app.use('/api/departments', require('./modules/academic/routes/departments'));
app.use('/api/courses', require('./modules/academic/routes/courses'));
app.use('/api/attendance', require('./modules/academic/routes/attendance'));
app.use('/api/exams', require('./modules/academic/routes/exams'));
app.use('/api/results', require('./modules/academic/routes/results'));
app.use('/api/fees', require('./modules/enrollment/routes/fees'));
app.use('/api/admissions', require('./modules/enrollment/routes/admissions'));
app.use('/api/timetable', require('./modules/academic/routes/timetable'));
app.use('/api/notifications', require('./modules/hrms/routes/notifications'));
app.use('/api/library', require('./modules/enrollment/routes/library'));
app.use('/api/placements', require('./modules/enrollment/routes/placements'));
app.use('/api/certificates', require('./modules/enrollment/routes/certificates'));
app.use('/api/dashboard', require('./modules/hrms/routes/dashboard'));
app.use('/api/hostel', require('./modules/enrollment/routes/hostel'));
app.use('/api/transport', require('./modules/enrollment/routes/transport'));
app.use('/api/leave', require('./modules/hrms/routes/leave'));
app.use('/api/payroll', require('./modules/hrms/routes/payroll'));
app.use('/api/lms', require('./modules/academic/routes/lms'));
app.use('/api/lifecycle', require('./modules/hrms/routes/lifecycle'));
app.use('/api/result-upload', require('./modules/academic/routes/resultUpload'));
app.use('/api/face-attendance', require('./modules/academic/routes/faceAttendance'));
app.use('/api/complaints', require('./modules/hrms/routes/complaints'));
app.use('/api/service-requests', require('./modules/hrms/routes/serviceRequests'));
app.use('/api/assignments', require('./modules/academic/routes/assignments'));
app.use('/api/student-documents', require('./modules/enrollment/routes/studentDocuments'));
app.use('/api/hod', require('./modules/hrms/routes/hod'));
app.use('/api/reports', require('./modules/hrms/routes/reports'));

if (isProduction) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api|\/uploads|\/health).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startTimetableNotifier();
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
