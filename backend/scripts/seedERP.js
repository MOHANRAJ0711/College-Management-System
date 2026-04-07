const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const { BusRoute, TransportSubscription } = require('../models/Transport');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const StudyMaterial = require('../models/StudyMaterial');
const Feedback = require('../models/Feedback');
const Scholarship = require('../models/Scholarship');
const Event = require('../models/Event');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    console.log('--- Connecting to Database ---');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    console.log('--- Clearing Collections ---');
    const models = [
      User, Student, Faculty, Department, Course, Hostel, Room, Allocation,
      BusRoute, TransportSubscription, LeaveRequest, Payroll, StudyMaterial,
      Feedback, Scholarship, Event
    ];
    for (const model of models) {
      await model.deleteMany({});
    }
    console.log('Database Purged!');

    console.log('--- Creating Departments ---');
    const depts = await Department.create([
      { name: 'Computer Science & Engineering', code: 'CSE', establishedYear: 2004 },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', establishedYear: 2004 },
      { name: 'Mechanical Engineering', code: 'MECH', establishedYear: 2004 }
    ]);

    console.log('--- Creating Courses (Subjects) ---');
    const courses = await Course.create([
      { name: 'Data Structures', code: 'CS301', department: depts[0]._id, semester: 3, type: 'Theory', credits: 4 },
      { name: 'Operating Systems', code: 'CS302', department: depts[0]._id, semester: 5, type: 'Theory', credits: 4 },
      { name: 'Electric Circuits', code: 'EE301', department: depts[1]._id, semester: 3, type: 'Theory', credits: 4 },
      { name: 'Power Systems', code: 'EE302', department: depts[1]._id, semester: 5, type: 'Theory', credits: 4 },
      { name: 'Machine Design', code: 'ME301', department: depts[2]._id, semester: 3, type: 'Theory', credits: 4 },
      { name: 'Thermal Engineering', code: 'ME302', department: depts[2]._id, semester: 5, type: 'Theory', credits: 4 }
    ]);

    console.log('--- Creating Admin ---');
    await User.create({
      name: 'Campus Admin',
      email: 'college.admin@gmail.com',
      password: '1234567890',
      role: 'admin'
    });

    console.log('--- Creating Faculty ---');
    const facultyData = [
      { name: 'Dr. John Miller', email: 'hod.cse@gmail.com', password: '1234567890', role: 'faculty', dept: depts[0]._id, isHOD: true, eid: 'F001' },
      { name: 'Prof. Alice Green', email: 'alice.cse@gmail.com', password: '1234567890', role: 'faculty', dept: depts[0]._id, isHOD: false, eid: 'F002' },
      { name: 'Dr. Robert King', email: 'hod.eee@gmail.com', password: '1234567890', role: 'faculty', dept: depts[1]._id, isHOD: true, eid: 'F003' },
      { name: 'Dr. Sarah Brown', email: 'hod.mech@gmail.com', password: '1234567890', role: 'faculty', dept: depts[2]._id, isHOD: true, eid: 'F004' }
    ];

    const facultyDocs = [];
    for (const f of facultyData) {
      const user = await User.create({ name: f.name, email: f.email, password: f.password, role: f.role });
      const fac = await Faculty.create({
        user: user._id,
        employeeId: f.eid,
        department: f.dept,
        designation: f.isHOD ? 'HOD' : 'Professor'
      });
      facultyDocs.push(fac);
      if (f.isHOD) {
        await Department.findByIdAndUpdate(f.dept, { hod: fac._id });
      }
    }

    console.log('--- Creating Students ---');
    const studentNames = [
      'ARUMUGAM', 'GOWTHAM', 'HARIHARAN', 'JAYAHARI', 'KARTHIK', 'KEERTHI',
      'LOKESH', 'MAHINDRAN', 'NAVEEN.S', 'NAVEEN.K', 'PAVITH', 'PERIYA KRISHNAN',
      'SABARI', 'SAKTHIVEL.', 'SARAVANAN', 'WILLIAM', 'BOOPATHI'
    ];

    const studentDocs = [];
    for (let i = 0; i < studentNames.length; i++) {
        const name = studentNames[i];
        const email = `${name.toLowerCase().replace(/[\s.]/g, '')}@gmail.com`;
        const user = await User.create({ name, email, password: '1234567890', role: 'student' });
        const std = await Student.create({
            user: user._id,
            rollNumber: `22CS${100 + i}`,
            department: depts[0]._id,
            course: courses[0]._id,
            semester: 3,
            phone: '9876543210'
        });
        studentDocs.push(std);
    }

    console.log('--- Seeding Logistics (Hostel & Transport) ---');
    const hostels = await Hostel.create([
        { name: 'Everest Residency', type: 'boys', description: 'Main campus boys residence' },
        { name: 'Victoria Towers', type: 'girls', description: 'Safety-first female accommodation' }
    ]);

    const rooms = await Room.create([
        { hostel: hostels[0]._id, roomNumber: '101', type: 'double', capacity: 2 },
        { hostel: hostels[0]._id, roomNumber: '102', type: 'single', capacity: 1 },
        { hostel: hostels[1]._id, roomNumber: 'G201', type: 'suite', capacity: 4 }
    ]);

    await Allocation.create({
        student: studentDocs[0]._id,
        hostel: hostels[0]._id,
        room: rooms[0]._id,
        messPreference: 'veg',
        status: 'allocated'
    });

    const routes = await BusRoute.create([
        { 
          routeName: 'Diamond Route (South)', vehicleNumber: 'TN-37-BJ-1234', 
          driverName: 'Kumar Swamy', driverPhone: '9000012345', capacity: 50, fee: 6000, 
          stops: [{ name: 'City Center', time: '07:30 AM' }, { name: 'Lake View', time: '08:00 AM' }] 
        }
    ]);

    await TransportSubscription.create({
        student: studentDocs[1]._id,
        route: routes[0]._id,
        stop: 'Lake View',
        status: 'active'
    });

    console.log('--- Seeding Governance (Leave & Payroll) ---');
    await LeaveRequest.create([
        { faculty: facultyDocs[1]._id, leaveType: 'sick', startDate: new Date(), endDate: new Date(), reason: 'Fever recovery', status: 'pending' },
        { faculty: facultyDocs[2]._id, leaveType: 'casual', startDate: new Date(), endDate: new Date(), reason: 'Family function', status: 'admin-approved' }
    ]);

    await Payroll.create({
        faculty: facultyDocs[0]._id,
        month: '2026-03',
        basicSalary: 60000,
        netPay: 54000,
        status: 'paid',
        paymentDate: new Date()
    });

    console.log('--- Seeding LMS (Study Forge) ---');
    await StudyMaterial.create([
        { title: 'Data Structures Unit-1', subject: courses[0]._id, faculty: facultyDocs[1]._id, fileType: 'pdf', fileUrl: 'https://docs.google.com/sample_ds.pdf', targetSemester: 3 },
        { title: 'Operating Systems Concepts', subject: courses[1]._id, faculty: facultyDocs[0]._id, fileType: 'link', fileUrl: 'https://os-tutorial.link', targetSemester: 5 }
    ]);

    await Feedback.create({
        student: studentDocs[0]._id,
        faculty: facultyDocs[0]._id,
        subject: courses[0]._id,
        ratings: { teaching: 5, punctuality: 4, delivery: 5, support: 5 },
        comment: 'Excellent professor with in-depth knowledge.',
        semester: 3
    });

    console.log('--- Seeding Lifecycle (Schemes & Events) ---');
    await Scholarship.create([
        { student: studentDocs[0]._id, schemeName: 'Merit Endowment 2026', type: 'institutional', amount: 15000, status: 'approved' }
    ]);

    await Event.create([
        { title: 'AI & Future Paradigm Shift', organizer: facultyDocs[0]._id, organizerModel: 'Faculty', type: 'seminar', venue: 'Main Auditorium', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 100000000), status: 'approved' }
    ]);

    console.log('\n=======================================');
    console.log('   ERP DATA SEEDING COMPLETE!           ');
    console.log('   Ready for Dry Run Verification       ');
    console.log('=======================================');
    process.exit(0);

  } catch (err) {
    console.error('SEEDING ERROR:', err);
    process.exit(1);
  }
}

seed();
