require('dotenv').config();
const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const u = await User.findOne({ name: 'Rupa' });
    if (!u) {
      console.log('User Rupa not found');
      process.exit(1);
    }
    console.log('User Rupa ID:', u._id);

    const hod = await Faculty.findOne({ user: u._id });
    console.log('HOD Found:', !!hod);
    console.log('Designation:', hod?.designation);
    console.log('Department:', hod?.department);

    if (!hod || hod.designation !== 'HOD') {
      console.log('HOD Check Failed');
      process.exit(1);
    }

    const deptFacultyIds = await Faculty.find({ department: hod.department }).distinct('_id');
    console.log('Dept Faculty IDs Count:', deptFacultyIds.length);
    console.log('IDs:', deptFacultyIds);

    const leaves = await LeaveRequest.find({ faculty: { $in: deptFacultyIds } })
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
      })
      .sort('-createdAt')
      .lean();

    console.log('Leaves Found:', leaves.length);
    if (leaves.length > 0) {
      console.log('First Leave Faculty:', leaves[0].faculty?._id);
      console.log('First Leave Faculty User:', leaves[0].faculty?.user?.name);
    }

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

test();
