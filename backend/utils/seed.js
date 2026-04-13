/**
 * Database seed script — run from backend: `node utils/seed.js` or `npm run seed`
 *
 * Seeds ALL modules with realistic test data:
 *   Admin, Faculty (incl. HODs), Students, Departments (with hod link),
 *   Courses, Notifications, Placements, Library, Exams, Attendance,
 *   Results, Fees, Timetables, Leave Requests, Payroll, Hostels,
 *   Transport (BusRoute + Subscriptions), Admissions,
 *   Complaints, Service Requests, and Assignments.
 */
const mongoose = require('mongoose');
const readline = require('readline');

const connectDB = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const LibraryBook = require('../models/LibraryBook');
const Placement = require('../models/Placement');
const Timetable = require('../models/Timetable');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const Hostel = require('../models/Hostel');
const { BusRoute, TransportSubscription } = require('../models/Transport');
const Admission = require('../models/Admission');
const Complaint = require('../models/Complaint');
const ServiceRequest = require('../models/ServiceRequest');
const Assignment = require('../models/Assignment');

function askYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const ok = /^y(es)?$/i.test(String(answer).trim());
      resolve(ok);
    });
  });
}

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/**
 * Compute letter grade based on percentage vs passing marks.
 */
function computeGrade(marksObtained, totalMarks, passingMarks) {
  if (totalMarks <= 0) return 'F';
  const pct = (marksObtained / totalMarks) * 100;
  if (passingMarks != null && marksObtained < passingMarks) return 'F';
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'D';
}

async function seed() {
  console.log('[seed] Connecting to MongoDB…');
  await connectDB();

  const ok = await askYesNo(
    '\n⚠️  This will DROP ALL DATA in the current database and re-seed sample data.\n    Type "yes" to continue, anything else to abort: '
  );
  if (!ok) {
    console.log('[seed] Aborted by user.');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('[seed] Dropping database…');
  await mongoose.connection.dropDatabase();

  // ─────────────────────────────────────────────────────────────────────────
  // DEPARTMENTS (without hod — we set hod after faculty creation)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating departments…');
  const deptCS = await Department.create({
    name: 'Computer Science',
    code: 'CS',
    description: 'Computer Science and Engineering',
    establishedYear: 1995,
    isActive: true,
  });
  const deptECE = await Department.create({
    name: 'Electronics',
    code: 'ECE',
    description: 'Electronics and Communication Engineering',
    establishedYear: 1998,
    isActive: true,
  });
  const deptIT = await Department.create({
    name: 'Information Technology',
    code: 'IT',
    description: 'Information Technology',
    establishedYear: 2001,
    isActive: true,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // COURSES
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating courses…');
  const courses = await Course.insertMany([
    {
      name: 'Data Structures',
      code: 'CS101',
      department: deptCS._id,
      semester: 1,
      credits: 4,
      type: 'Theory',
      description: 'Fundamental data structures and algorithms',
      isActive: true,
    },
    {
      name: 'Operating Systems',
      code: 'CS302',
      department: deptCS._id,
      semester: 5,
      credits: 4,
      type: 'Theory',
      description: 'OS concepts, processes, memory, and file systems',
      isActive: true,
    },
    {
      name: 'Digital Circuits',
      code: 'ECE201',
      department: deptECE._id,
      semester: 3,
      credits: 3,
      type: 'Theory',
      description: 'Combinational and sequential logic design',
      isActive: true,
    },
    {
      name: 'VLSI Design',
      code: 'ECE401',
      department: deptECE._id,
      semester: 7,
      credits: 4,
      type: 'Elective',
      description: 'VLSI fundamentals and CAD tools',
      isActive: true,
    },
    {
      name: 'Web Technologies',
      code: 'IT101',
      department: deptIT._id,
      semester: 2,
      credits: 3,
      type: 'Theory',
      description: 'HTML, CSS, JavaScript, and server-side basics',
      isActive: true,
    },
    {
      name: 'Cloud Computing',
      code: 'IT303',
      department: deptIT._id,
      semester: 6,
      credits: 3,
      type: 'Theory',
      description: 'Cloud service models, virtualization, and deployment',
      isActive: true,
    },
    {
      name: 'Database Management Systems',
      code: 'CS205',
      department: deptCS._id,
      semester: 3,
      credits: 4,
      type: 'Theory',
      description: 'Relational databases, SQL, and normalisation',
      isActive: true,
    },
  ]);
  const [cCS101, cCS302, cECE201, cECE401, cIT101, cIT303, cCS205] = courses;

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN USER
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating admin user…');
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FACULTY (including 3 HODs — one per department)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating faculty users and profiles…');

  // HOD — CS
  const hodCSUser = await User.create({
    name: 'Dr. Alice Kumar',
    email: 'hod.cs@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const hodCS = await Faculty.create({
    user: hodCSUser._id,
    employeeId: 'FAC001',
    department: deptCS._id,
    designation: 'HOD',
    qualification: 'Ph.D. Computer Science',
    specialization: 'Algorithms and Systems',
    experience: 15,
    phone: '+91-9876500001',
    dateOfJoining: new Date('2010-08-01'),
    subjects: [cCS101._id, cCS302._id, cCS205._id],
  });

  // HOD — ECE
  const hodECEUser = await User.create({
    name: 'Prof. Bob Singh',
    email: 'hod.ece@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const hodECE = await Faculty.create({
    user: hodECEUser._id,
    employeeId: 'FAC002',
    department: deptECE._id,
    designation: 'HOD',
    qualification: 'Ph.D. VLSI',
    specialization: 'Digital and Analog Design',
    experience: 12,
    phone: '+91-9876500002',
    dateOfJoining: new Date('2013-01-15'),
    subjects: [cECE201._id, cECE401._id],
  });

  // HOD — IT
  const hodITUser = await User.create({
    name: 'Dr. Priya Nair',
    email: 'hod.it@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const hodIT = await Faculty.create({
    user: hodITUser._id,
    employeeId: 'FAC003',
    department: deptIT._id,
    designation: 'HOD',
    qualification: 'Ph.D. Information Technology',
    specialization: 'Cloud Architecture',
    experience: 10,
    phone: '+91-9876500003',
    dateOfJoining: new Date('2015-06-01'),
    subjects: [cIT101._id, cIT303._id],
  });

  // Regular faculty
  const facUser1 = await User.create({
    name: 'Mr. Kiran Mehta',
    email: 'faculty1@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const faculty1 = await Faculty.create({
    user: facUser1._id,
    employeeId: 'FAC004',
    department: deptCS._id,
    designation: 'Assistant Professor',
    qualification: 'M.Tech Computer Science',
    specialization: 'Machine Learning',
    experience: 5,
    phone: '+91-9876500004',
    dateOfJoining: new Date('2020-07-01'),
    subjects: [cCS101._id, cCS205._id],
  });

  const facUser2 = await User.create({
    name: 'Ms. Divya Rao',
    email: 'faculty2@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const faculty2 = await Faculty.create({
    user: facUser2._id,
    employeeId: 'FAC005',
    department: deptECE._id,
    designation: 'Associate Professor',
    qualification: 'M.Tech Electronics',
    specialization: 'Signal Processing',
    experience: 8,
    phone: '+91-9876500005',
    dateOfJoining: new Date('2017-01-10'),
    subjects: [cECE201._id],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Update departments with HOD references
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Linking HODs to departments…');
  await Department.findByIdAndUpdate(deptCS._id, { hod: hodCS._id });
  await Department.findByIdAndUpdate(deptECE._id, { hod: hodECE._id });
  await Department.findByIdAndUpdate(deptIT._id, { hod: hodIT._id });

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating student users and profiles…');
  const stuUser1 = await User.create({
    name: 'Riya Sharma',
    email: 'student1@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });
  const stuUser2 = await User.create({
    name: 'Arjun Patel',
    email: 'student2@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });
  const stuUser3 = await User.create({
    name: 'Neha Gupta',
    email: 'student3@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });
  const stuUser4 = await User.create({
    name: 'Rahul Verma',
    email: 'student4@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });

  const student1 = await Student.create({
    user: stuUser1._id,
    rollNumber: 'CS2024001',
    registrationNumber: 'REG2024CS001',
    department: deptCS._id,
    course: cCS302._id,
    semester: 5,
    section: 'A',
    batch: '2024',
    gender: 'female',
    phone: '+91-9000000001',
    dateOfBirth: new Date('2004-03-15'),
    guardianName: 'Mr. Sharma',
    guardianPhone: '+91-9000000010',
    bloodGroup: 'B+',
    admissionDate: new Date('2024-07-15'),
    address: { street: '12 MG Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  });

  const student2 = await Student.create({
    user: stuUser2._id,
    rollNumber: 'ECE2024002',
    registrationNumber: 'REG2024ECE002',
    department: deptECE._id,
    course: cECE201._id,
    semester: 3,
    section: 'B',
    batch: '2024',
    gender: 'male',
    phone: '+91-9000000002',
    dateOfBirth: new Date('2004-06-22'),
    guardianName: 'Mrs. Patel',
    guardianPhone: '+91-9000000011',
    bloodGroup: 'O+',
    admissionDate: new Date('2024-07-15'),
    address: { street: '45 Anna Salai', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001' },
  });

  const student3 = await Student.create({
    user: stuUser3._id,
    rollNumber: 'IT2024003',
    registrationNumber: 'REG2024IT003',
    department: deptIT._id,
    course: cIT101._id,
    semester: 2,
    section: 'A',
    batch: '2024',
    gender: 'female',
    phone: '+91-9000000003',
    dateOfBirth: new Date('2004-11-08'),
    guardianName: 'Mr. Gupta',
    guardianPhone: '+91-9000000012',
    bloodGroup: 'A+',
    admissionDate: new Date('2024-07-15'),
    address: { street: '7 Park View', city: 'Madurai', state: 'Tamil Nadu', pincode: '625001' },
  });

  const student4 = await Student.create({
    user: stuUser4._id,
    rollNumber: 'CS2024004',
    registrationNumber: 'REG2024CS004',
    department: deptCS._id,
    course: cCS101._id,
    semester: 1,
    section: 'A',
    batch: '2024',
    gender: 'male',
    phone: '+91-9000000004',
    dateOfBirth: new Date('2005-01-19'),
    guardianName: 'Mr. Verma',
    guardianPhone: '+91-9000000013',
    bloodGroup: 'AB+',
    admissionDate: new Date('2024-07-15'),
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating notifications…');
  await Notification.insertMany([
    {
      title: 'Welcome to the new academic year',
      message: 'Classes begin next Monday. Check your timetable in the portal.',
      type: 'general',
      targetRole: 'all',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Mid-term exam schedule published',
      message: 'Internal assessments for odd-semester courses are scheduled for next month.',
      type: 'exam',
      targetRole: 'student',
      department: deptCS._id,
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Fee payment deadline',
      message: 'Last date for semester fee payment without fine is the 30th of this month.',
      type: 'fee',
      targetRole: 'student',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Research seminar — AI in education',
      message: 'Open to all faculty and final-year students. Auditorium Block A.',
      type: 'event',
      targetRole: 'faculty',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Campus placement drive',
      message: 'Multiple companies visiting this month. Eligible students must register.',
      type: 'placement',
      targetRole: 'student',
      createdBy: admin._id,
      isActive: true,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // PLACEMENTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating placement drives…');
  await Placement.insertMany([
    {
      companyName: 'TechNova Solutions',
      description: 'Product and services company hiring full-stack engineers.',
      jobRole: 'Software Engineer Trainee',
      package: '8 LPA',
      eligibilityCriteria: {
        minCGPA: 7.0,
        departments: [deptCS._id, deptIT._id],
        batch: '2024',
      },
      lastDate: new Date('2026-04-15'),
      driveDate: new Date('2026-04-22'),
      venue: 'Main Auditorium',
      status: 'upcoming',
      applicants: [
        { student: student1._id, appliedDate: new Date('2026-03-01'), status: 'applied' },
        { student: student3._id, appliedDate: new Date('2026-03-02'), status: 'shortlisted' },
      ],
      createdBy: admin._id,
    },
    {
      companyName: 'CircuitWorks India',
      description: 'Semiconductor design and verification roles.',
      jobRole: 'Design Engineer',
      package: '10 LPA',
      eligibilityCriteria: {
        minCGPA: 7.5,
        departments: [deptECE._id],
        batch: '2024',
      },
      lastDate: new Date('2026-05-01'),
      driveDate: new Date('2026-05-10'),
      venue: 'ECE Seminar Hall',
      status: 'upcoming',
      applicants: [
        { student: student2._id, appliedDate: new Date('2026-03-05'), status: 'applied' },
      ],
      createdBy: admin._id,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // LIBRARY BOOKS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating library books…');
  await LibraryBook.insertMany([
    {
      title: 'Introduction to Algorithms',
      author: 'Cormen, Leiserson, Rivest, Stein',
      isbn: '9780262033848',
      publisher: 'MIT Press',
      edition: '3rd',
      category: 'Computer Science',
      department: deptCS._id,
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: 'CS-A1',
      isActive: true,
    },
    {
      title: 'Digital Design and Computer Architecture',
      author: 'Harris & Harris',
      isbn: '9780123944244',
      publisher: 'Morgan Kaufmann',
      edition: '2nd',
      category: 'Electronics',
      department: deptECE._id,
      totalCopies: 3,
      availableCopies: 3,
      shelfLocation: 'ECE-B2',
      isActive: true,
    },
    {
      title: 'Modern Web Development',
      author: 'Various',
      isbn: '9781492086921',
      publisher: "O'Reilly",
      edition: '1st',
      category: 'Web',
      department: deptIT._id,
      totalCopies: 4,
      availableCopies: 2,
      shelfLocation: 'IT-C3',
      isActive: true,
    },
    {
      title: 'Operating System Concepts',
      author: 'Silberschatz, Galvin, Gagne',
      isbn: '9781118063330',
      publisher: 'Wiley',
      edition: '10th',
      category: 'Computer Science',
      department: deptCS._id,
      totalCopies: 6,
      availableCopies: 5,
      shelfLocation: 'CS-A2',
      isActive: true,
    },
    {
      title: 'Cloud Computing: Concepts and Practice',
      author: 'Sosinsky',
      isbn: '9780128093515',
      publisher: 'Elsevier',
      edition: '1st',
      category: 'Cloud',
      department: deptIT._id,
      totalCopies: 2,
      availableCopies: 2,
      shelfLocation: 'IT-C1',
      isActive: true,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // EXAMS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating exams…');
  const exam1 = await Exam.create({
    name: 'CS302 Internal Assessment 1',
    type: 'internal',
    course: cCS302._id,
    department: deptCS._id,
    semester: 5,
    date: new Date('2026-04-10'),
    startTime: '10:00',
    endTime: '11:30',
    totalMarks: 50,
    passingMarks: 20,
    room: 'CS-201',
    status: 'scheduled',
  });
  const exam2 = await Exam.create({
    name: 'ECE201 End Semester',
    type: 'semester',
    course: cECE201._id,
    department: deptECE._id,
    semester: 3,
    date: new Date('2026-05-05'),
    startTime: '14:00',
    endTime: '17:00',
    totalMarks: 100,
    passingMarks: 40,
    room: 'ECE-Lab-1',
    status: 'scheduled',
  });
  const exam3 = await Exam.create({
    name: 'IT101 Practical Exam',
    type: 'internal',
    course: cIT101._id,
    department: deptIT._id,
    semester: 2,
    date: new Date('2026-04-20'),
    startTime: '09:00',
    endTime: '12:00',
    totalMarks: 60,
    passingMarks: 24,
    room: 'IT-Lab-2',
    status: 'completed',
  });
  const exam4 = await Exam.create({
    name: 'CS101 Unit Test',
    type: 'internal',
    course: cCS101._id,
    department: deptCS._id,
    semester: 1,
    date: new Date('2026-04-25'),
    startTime: '11:00',
    endTime: '12:00',
    totalMarks: 25,
    passingMarks: 10,
    room: 'CS-101',
    status: 'scheduled',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ATTENDANCE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating attendance records…');
  const d1 = startOfDay('2026-03-01');
  const d2 = startOfDay('2026-03-03');
  const d3 = startOfDay('2026-03-05');
  const d4 = startOfDay('2026-03-07');
  const d5 = startOfDay('2026-03-10');

  await Attendance.insertMany([
    // Student 1 — CS302 (3 sessions: present, late, absent)
    { student: student1._id, course: cCS302._id, faculty: hodCS._id,   date: d1, status: 'present', semester: 5 },
    { student: student1._id, course: cCS302._id, faculty: hodCS._id,   date: d2, status: 'late',    semester: 5 },
    { student: student1._id, course: cCS302._id, faculty: hodCS._id,   date: d3, status: 'absent',  semester: 5 },
    // Student 1 — CS101 (2 sessions: present, present)
    { student: student1._id, course: cCS101._id, faculty: faculty1._id, date: d4, status: 'present', semester: 5 },
    { student: student1._id, course: cCS101._id, faculty: faculty1._id, date: d5, status: 'present', semester: 5 },

    // Student 2 — ECE201 (3 sessions: present, absent, present)
    { student: student2._id, course: cECE201._id, faculty: hodECE._id,   date: d1, status: 'present', semester: 3 },
    { student: student2._id, course: cECE201._id, faculty: hodECE._id,   date: d3, status: 'absent',  semester: 3 },
    { student: student2._id, course: cECE201._id, faculty: faculty2._id, date: d5, status: 'present', semester: 3 },

    // Student 3 — IT101 (2 sessions: present, present)
    { student: student3._id, course: cIT101._id, faculty: hodIT._id, date: d1, status: 'present', semester: 2 },
    { student: student3._id, course: cIT101._id, faculty: hodIT._id, date: d2, status: 'present', semester: 2 },

    // Student 4 — CS101 (2 sessions: late, present)
    { student: student4._id, course: cCS101._id, faculty: faculty1._id, date: d1, status: 'late',    semester: 1 },
    { student: student4._id, course: cCS101._id, faculty: faculty1._id, date: d4, status: 'present', semester: 1 },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS (grades computed using computeGrade for consistency)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating exam results…');
  // exam1: totalMarks=50, passingMarks=20
  // exam2: totalMarks=100, passingMarks=40
  // exam3: totalMarks=60, passingMarks=24
  await Result.insertMany([
    {
      student: student1._id,
      exam: exam1._id,
      course: cCS302._id,
      marksObtained: 42, // 84% → A+
      grade: computeGrade(42, 50, 20),
      remarks: 'Excellent performance',
      publishedBy: hodCS._id,
      isPublished: true,
    },
    {
      student: student2._id,
      exam: exam2._id,
      course: cECE201._id,
      marksObtained: 72, // 72% → A
      grade: computeGrade(72, 100, 40),
      publishedBy: hodECE._id,
      isPublished: true,
    },
    {
      student: student3._id,
      exam: exam3._id,
      course: cIT101._id,
      marksObtained: 52, // 86.7% → A+
      grade: computeGrade(52, 60, 24),
      publishedBy: hodIT._id,
      isPublished: true,
    },
    {
      student: student4._id,
      exam: exam4._id,
      course: cCS101._id,
      marksObtained: 18, // 72% → A
      grade: computeGrade(18, 25, 10),
      publishedBy: faculty1._id,
      isPublished: false, // not yet published
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // FEES
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating fee records…');
  await Fee.insertMany([
    {
      student: student1._id,
      feeType: 'tuition',
      amount: 45000,
      semester: 5,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-30'),
      paidDate: new Date('2026-03-10'),
      status: 'paid',
      paymentMethod: 'upi',
      transactionId: 'UPI20260310001',
      receiptNumber: 'RCP-2026-001',
    },
    {
      student: student1._id,
      feeType: 'hostel',
      amount: 18000,
      semester: 5,
      academicYear: '2025-26',
      dueDate: new Date('2026-04-15'),
      status: 'overdue',
    },
    {
      student: student2._id,
      feeType: 'exam',
      amount: 2500,
      semester: 3,
      academicYear: '2025-26',
      dueDate: new Date('2026-04-01'),
      status: 'pending',
    },
    {
      student: student2._id,
      feeType: 'tuition',
      amount: 44000,
      semester: 3,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-30'),
      paidDate: new Date('2026-03-28'),
      status: 'partial',
      paymentMethod: 'cash',
      remarks: 'Balance ₹10,000 to be cleared next week',
    },
    {
      student: student3._id,
      feeType: 'library',
      amount: 500,
      semester: 2,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-15'),
      paidDate: new Date('2026-03-12'),
      status: 'paid',
      paymentMethod: 'online',
      transactionId: 'PG20260312002',
      receiptNumber: 'RCP-2026-002',
    },
    {
      student: student3._id,
      feeType: 'tuition',
      amount: 44000,
      semester: 2,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-30'),
      status: 'pending',
    },
    {
      student: student4._id,
      feeType: 'tuition',
      amount: 45000,
      semester: 1,
      academicYear: '2025-26',
      dueDate: new Date('2026-08-15'),
      paidDate: new Date('2026-07-20'),
      status: 'paid',
      paymentMethod: 'online',
      transactionId: 'PG20260720003',
      receiptNumber: 'RCP-2026-003',
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // TIMETABLE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating timetable entries…');
  await Timetable.insertMany([
    {
      department: deptCS._id,
      semester: 5,
      section: 'A',
      day: 'Monday',
      academicYear: '2025-26',
      isActive: true,
      periods: [
        { periodNumber: 1, startTime: '09:00', endTime: '10:00', course: cCS302._id, faculty: hodCS._id,   room: 'CS-201' },
        { periodNumber: 2, startTime: '10:00', endTime: '11:00', course: cCS101._id, faculty: faculty1._id, room: 'CS-101' },
        { periodNumber: 3, startTime: '11:15', endTime: '12:15', course: cCS205._id, faculty: faculty1._id, room: 'CS-301' },
      ],
    },
    {
      department: deptCS._id,
      semester: 5,
      section: 'A',
      day: 'Wednesday',
      academicYear: '2025-26',
      isActive: true,
      periods: [
        { periodNumber: 1, startTime: '09:00', endTime: '10:00', course: cCS302._id, faculty: hodCS._id,   room: 'CS-201' },
        { periodNumber: 2, startTime: '10:00', endTime: '11:00', course: cCS205._id, faculty: faculty1._id, room: 'CS-Lab' },
      ],
    },
    {
      department: deptECE._id,
      semester: 3,
      section: 'B',
      day: 'Tuesday',
      academicYear: '2025-26',
      isActive: true,
      periods: [
        { periodNumber: 1, startTime: '09:00', endTime: '10:00', course: cECE201._id, faculty: hodECE._id,   room: 'ECE-101' },
        { periodNumber: 2, startTime: '10:00', endTime: '11:00', course: cECE401._id, faculty: faculty2._id, room: 'ECE-Lab' },
      ],
    },
    {
      department: deptIT._id,
      semester: 2,
      section: 'A',
      day: 'Thursday',
      academicYear: '2025-26',
      isActive: true,
      periods: [
        { periodNumber: 1, startTime: '09:00', endTime: '10:00', course: cIT101._id,  faculty: hodIT._id, room: 'IT-101' },
        { periodNumber: 2, startTime: '10:00', endTime: '11:00', course: cIT303._id,  faculty: hodIT._id, room: 'IT-Lab' },
      ],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // LEAVE REQUESTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating leave requests…');
  await LeaveRequest.insertMany([
    {
      faculty: faculty1._id,
      leaveType: 'sick',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-12'),
      reason: 'Fever and viral infection — doctor prescribed 3-day bed rest.',
      status: 'hod-approved',
      attachments: [],
    },
    {
      faculty: faculty2._id,
      leaveType: 'casual',
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-20'),
      reason: "Family function — sister's wedding ceremony.",
      status: 'admin-approved',
      attachments: [],
    },
    {
      faculty: hodCS._id,
      leaveType: 'earned',
      startDate: new Date('2026-04-05'),
      endDate: new Date('2026-04-08'),
      reason: 'Academic conference presentation at IIT Bombay.',
      status: 'pending',
      attachments: [],
    },
    {
      faculty: faculty1._id,
      leaveType: 'casual',
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-15'),
      reason: 'Personal errand.',
      status: 'rejected',
      rejectionReason: 'Mid-term exams ongoing — cannot approve leave.',
      attachments: [],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // PAYROLL
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating payroll records…');
  const payrollData = [
    { faculty: hodCS._id,   basicSalary: 75000, hra: 15000,  da: 7500,  pf: 7500,  month: '2026-02', status: 'paid',      paymentDate: new Date('2026-03-01') },
    { faculty: hodECE._id,  basicSalary: 75000, hra: 15000,  da: 7500,  pf: 7500,  month: '2026-02', status: 'paid',      paymentDate: new Date('2026-03-01') },
    { faculty: hodIT._id,   basicSalary: 70000, hra: 14000,  da: 7000,  pf: 7000,  month: '2026-02', status: 'paid',      paymentDate: new Date('2026-03-01') },
    { faculty: faculty1._id, basicSalary: 50000, hra: 10000, da: 5000,  pf: 5000,  month: '2026-02', status: 'paid',      paymentDate: new Date('2026-03-01') },
    { faculty: faculty2._id, basicSalary: 60000, hra: 12000, da: 6000,  pf: 6000,  month: '2026-02', status: 'paid',      paymentDate: new Date('2026-03-01') },
    { faculty: hodCS._id,   basicSalary: 75000, hra: 15000,  da: 7500,  pf: 7500,  month: '2026-03', status: 'generated', paymentDate: null },
    { faculty: hodECE._id,  basicSalary: 75000, hra: 15000,  da: 7500,  pf: 7500,  month: '2026-03', status: 'generated', paymentDate: null },
    { faculty: hodIT._id,   basicSalary: 70000, hra: 14000,  da: 7000,  pf: 7000,  month: '2026-03', status: 'generated', paymentDate: null },
    { faculty: faculty1._id, basicSalary: 50000, hra: 10000, da: 5000,  pf: 5000,  month: '2026-03', status: 'generated', paymentDate: null },
    { faculty: faculty2._id, basicSalary: 60000, hra: 12000, da: 6000,  pf: 6000,  month: '2026-03', status: 'generated', paymentDate: null },
  ];

  await Payroll.insertMany(payrollData.map((p) => ({
    faculty: p.faculty,
    month: p.month,
    basicSalary: p.basicSalary,
    allowances: { hra: p.hra, da: p.da },
    deductions: { pf: p.pf },
    netPay: p.basicSalary + p.hra + p.da - p.pf,
    status: p.status,
    ...(p.paymentDate ? { paymentDate: p.paymentDate } : {}),
  })));

  // ─────────────────────────────────────────────────────────────────────────
  // HOSTELS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating hostels…');
  const hostelBoys = await Hostel.create({
    name: 'Tagore Boys Hostel',
    type: 'boys',
    description: 'On-campus boys hostel with 200 rooms, Wi-Fi, and mess facilities.',
    warden: faculty1._id,
    contactPhone: '+91-9100000001',
    isActive: true,
  });
  const hostelGirls = await Hostel.create({
    name: 'Sarojini Girls Hostel',
    type: 'girls',
    description: 'On-campus girls hostel with 150 rooms, 24-hour security, and mess.',
    warden: faculty2._id,
    contactPhone: '+91-9100000002',
    isActive: true,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT (Bus Routes + Subscriptions)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating bus routes and transport subscriptions…');
  const route1 = await BusRoute.create({
    routeName: 'Route A — Anna Nagar to College',
    vehicleNumber: 'TN01AB1234',
    driverName: 'Murugan',
    driverPhone: '+91-9500000001',
    capacity: 50,
    stops: [
      { name: 'Anna Nagar West',  time: '07:15' },
      { name: 'Koyambedu',        time: '07:30' },
      { name: 'Vadapalani',       time: '07:45' },
      { name: 'College Gate',     time: '08:15' },
    ],
    fee: 4500,
    isActive: true,
  });
  const route2 = await BusRoute.create({
    routeName: 'Route B — Tambaram to College',
    vehicleNumber: 'TN01CD5678',
    driverName: 'Selvam',
    driverPhone: '+91-9500000002',
    capacity: 40,
    stops: [
      { name: 'Tambaram',         time: '07:00' },
      { name: 'Chromepet',        time: '07:15' },
      { name: 'Pallavaram',       time: '07:30' },
      { name: 'College Gate',     time: '08:10' },
    ],
    fee: 5000,
    isActive: true,
  });

  await TransportSubscription.insertMany([
    {
      student: student2._id,
      route:   route1._id,
      stop:    'Koyambedu',
      subscriptionDate: new Date('2026-07-20'),
      status: 'active',
      paymentStatus: 'paid',
    },
    {
      student: student4._id,
      route:   route2._id,
      stop:    'Tambaram',
      subscriptionDate: new Date('2026-07-22'),
      status: 'active',
      paymentStatus: 'pending',
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMISSIONS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating admission applications…');
  await Admission.insertMany([
    {
      applicantName: 'Sanjay Iyer',
      email: 'sanjay.iyer@example.com',
      phone: '+91-9800000010',
      dateOfBirth: new Date('2006-05-12'),
      gender: 'male',
      fatherName: 'Ramesh Iyer',
      motherName: 'Lakshmi Iyer',
      address: { street: '18 Poes Garden', city: 'Chennai', state: 'Tamil Nadu', pincode: '600086' },
      previousEducation: { institution: 'St. Joseph CBSE', board: 'CBSE', percentage: 88.4, yearOfPassing: 2025 },
      department: deptCS._id,
      course: cCS101._id,
      status: 'pending',
      meritScore: 88.4,
      appliedDate: new Date('2026-04-01'),
    },
    {
      applicantName: 'Ayesha Begum',
      email: 'ayesha.begum@example.com',
      phone: '+91-9800000011',
      dateOfBirth: new Date('2006-08-22'),
      gender: 'female',
      fatherName: 'Abdul Rahman',
      motherName: 'Fatima Begum',
      address: { street: '5 Royapettah', city: 'Chennai', state: 'Tamil Nadu', pincode: '600014' },
      previousEducation: { institution: 'DAV Matric School', board: 'State Board', percentage: 91.2, yearOfPassing: 2025 },
      department: deptIT._id,
      course: cIT101._id,
      status: 'under_review',
      meritScore: 91.2,
      appliedDate: new Date('2026-04-02'),
    },
    {
      applicantName: 'Vikram Joshi',
      email: 'vikram.joshi@example.com',
      phone: '+91-9800000012',
      dateOfBirth: new Date('2006-02-15'),
      gender: 'male',
      fatherName: 'Suresh Joshi',
      motherName: 'Meena Joshi',
      address: { street: '22 Adyar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020' },
      previousEducation: { institution: 'Kendriya Vidyalaya', board: 'CBSE', percentage: 79.6, yearOfPassing: 2025 },
      department: deptECE._id,
      course: cECE201._id,
      status: 'approved',
      meritScore: 79.6,
      remarks: 'Approved for the 2026 batch.',
      appliedDate: new Date('2026-03-28'),
    },
    {
      applicantName: 'Pooja Ganesan',
      email: 'pooja.ganesan@example.com',
      phone: '+91-9800000013',
      dateOfBirth: new Date('2006-11-03'),
      gender: 'female',
      fatherName: 'Ganesan K',
      motherName: 'Uma Ganesan',
      address: { street: '3 T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017' },
      previousEducation: { institution: "SRM Higher Secondary", board: 'State Board', percentage: 65.0, yearOfPassing: 2025 },
      department: deptCS._id,
      status: 'rejected',
      meritScore: 65.0,
      remarks: 'Does not meet minimum 70% eligibility cutoff.',
      appliedDate: new Date('2026-03-25'),
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLAINTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating complaints…');
  await Complaint.insertMany([
    {
      student: student1._id,
      user: stuUser1._id,
      title: 'Projector not working in CS-201',
      category: 'infrastructure',
      description: 'The projector in classroom CS-201 has been malfunctioning for two weeks. It affects the quality of lectures significantly.',
      status: 'in_review',
      priority: 'high',
      isAnonymous: false,
    },
    {
      student: student2._id,
      user: stuUser2._id,
      title: 'Lab equipment damaged',
      category: 'infrastructure',
      description: 'Two oscilloscopes in ECE-Lab-1 are broken. Lab practicals are being disrupted.',
      status: 'pending',
      priority: 'medium',
      isAnonymous: false,
    },
    {
      student: student3._id,
      user: stuUser3._id,
      title: 'Complaint about attendance marking',
      category: 'academic',
      description: 'I was marked absent on 2026-03-05 but I was present. Please review.',
      status: 'resolved',
      priority: 'low',
      isAnonymous: false,
      adminRemarks: 'Attendance corrected after manual verification.',
      resolvedAt: new Date('2026-03-10'),
    },
    {
      student: student4._id,
      user: stuUser4._id,
      title: 'Canteen food quality issue',
      category: 'other',
      description: 'Food quality in the canteen has deteriorated. Reporting for action.',
      status: 'pending',
      priority: 'medium',
      isAnonymous: true,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // SERVICE REQUESTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating service requests…');
  await ServiceRequest.insertMany([
    {
      student: student1._id,
      user: stuUser1._id,
      type: 'bonafide',
      purpose: 'Required for bank loan application.',
      status: 'ready',
      urgency: 'normal',
      copies: 2,
      adminNote: 'Certificate prepared and ready for collection.',
    },
    {
      student: student2._id,
      user: stuUser2._id,
      type: 'id_card_reissue',
      purpose: 'Original ID card lost.',
      status: 'processing',
      urgency: 'urgent',
      copies: 1,
    },
    {
      student: student3._id,
      user: stuUser3._id,
      type: 'transcript',
      purpose: 'Required for university application abroad.',
      status: 'pending',
      urgency: 'normal',
      copies: 3,
    },
    {
      student: student4._id,
      user: stuUser4._id,
      type: 'fee_receipt',
      purpose: 'Need receipt for scholarship documentation.',
      status: 'delivered',
      urgency: 'normal',
      copies: 1,
      deliveryDate: new Date('2026-03-15'),
      adminNote: 'Fee receipt delivered in person.',
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // ASSIGNMENTS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[seed] Creating assignments…');
  await Assignment.insertMany([
    {
      title: 'Data Structures — Linked List Implementation',
      description: 'Implement singly and doubly linked lists in C with insert, delete, and search operations. Submit source code and a 2-page report.',
      course: cCS101._id,
      faculty: faculty1._id,
      department: deptCS._id,
      semester: 1,
      section: 'A',
      dueDate: new Date('2026-04-30'),
      maxMarks: 20,
      status: 'active',
      submissions: [
        {
          student: student4._id,
          fileName: 'linked_list_CS2024004.zip',
          fileUrl: '/uploads/assignments/linked_list_CS2024004.zip',
          submittedAt: new Date('2026-04-15'),
          marks: 17,
          feedback: 'Good implementation. Doubly linked list traversal could be improved.',
          status: 'graded',
        },
      ],
    },
    {
      title: 'Operating Systems — Process Scheduling Simulation',
      description: 'Write a simulation program for FCFS, SJF, and Round Robin scheduling algorithms. Include Gantt charts and comparison table.',
      course: cCS302._id,
      faculty: hodCS._id,
      department: deptCS._id,
      semester: 5,
      section: 'A',
      dueDate: new Date('2026-04-25'),
      maxMarks: 25,
      status: 'active',
      submissions: [
        {
          student: student1._id,
          fileName: 'scheduling_CS2024001.pdf',
          fileUrl: '/uploads/assignments/scheduling_CS2024001.pdf',
          submittedAt: new Date('2026-04-20'),
          status: 'submitted',
        },
      ],
    },
    {
      title: 'Digital Circuits — Logic Gate Design',
      description: 'Design a 4-bit binary adder using logic gates. Submit KiCad schematic and truth table.',
      course: cECE201._id,
      faculty: faculty2._id,
      department: deptECE._id,
      semester: 3,
      section: 'B',
      dueDate: new Date('2026-04-18'),
      maxMarks: 15,
      status: 'closed',
      submissions: [
        {
          student: student2._id,
          fileName: 'adder_ECE2024002.zip',
          fileUrl: '/uploads/assignments/adder_ECE2024002.zip',
          submittedAt: new Date('2026-04-17'),
          marks: 13,
          feedback: 'Correct design. Minor layout issues in schematic.',
          status: 'graded',
        },
      ],
    },
    {
      title: 'Web Technologies — Portfolio Website',
      description: 'Create a personal portfolio website using HTML, CSS, and JavaScript. Must include About, Projects, and Contact sections. Host on GitHub Pages.',
      course: cIT101._id,
      faculty: hodIT._id,
      department: deptIT._id,
      semester: 2,
      section: 'A',
      dueDate: new Date('2026-05-05'),
      maxMarks: 30,
      status: 'active',
      submissions: [],
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // SEED COMPLETE — Print credentials
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[seed] ✓ Seeding completed successfully.\n');
  console.log('  ─────── Login Credentials ───────');
  console.log('  Admin:     admin@college.edu        / admin123');
  console.log('  HOD (CS):  hod.cs@college.edu       / faculty123');
  console.log('  HOD (ECE): hod.ece@college.edu      / faculty123');
  console.log('  HOD (IT):  hod.it@college.edu       / faculty123');
  console.log('  Faculty:   faculty1@college.edu     / faculty123');
  console.log('  Faculty:   faculty2@college.edu     / faculty123');
  console.log('  Student:   student1@college.edu     / student123  (CS Sem 5)');
  console.log('  Student:   student2@college.edu     / student123  (ECE Sem 3)');
  console.log('  Student:   student3@college.edu     / student123  (IT Sem 2)');
  console.log('  Student:   student4@college.edu     / student123  (CS Sem 1)');
  console.log('');
  console.log('  ─────── Seeded Data Summary ───────');
  console.log('  Departments:       3 (CS, ECE, IT — all with HOD assigned)');
  console.log('  Courses:           7');
  console.log('  Faculty:           5 (3 HODs + 2 regular)');
  console.log('  Students:          4');
  console.log('  Notifications:     5');
  console.log('  Placements:        2');
  console.log('  Library Books:     5');
  console.log('  Exams:             4');
  console.log('  Attendance:        12 records');
  console.log('  Results:           4 (3 published, 1 draft)');
  console.log('  Fees:              7 records');
  console.log('  Timetable:         4 entries');
  console.log('  Leave Requests:    4 (pending/approved/rejected)');
  console.log('  Payroll:           10 records (Feb paid, Mar generated)');
  console.log('  Hostels:           2 (boys + girls)');
  console.log('  Bus Routes:        2 + 2 subscriptions');
  console.log('  Admissions:        4 (pending/review/approved/rejected)');
  console.log('  Complaints:        4');
  console.log('  Service Requests:  4');
  console.log('  Assignments:       4 (with submissions)');
  console.log('');

  await mongoose.connection.close();
  console.log('[seed] Database connection closed.');
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('[seed] Error:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
