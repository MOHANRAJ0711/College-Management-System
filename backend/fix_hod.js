require('dotenv').config();
const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');
const User = require('./models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ name: 'Rupa' });
  const dept = await Department.findOne({ name: 'Agriculture' });

  if (user && dept) {
    const faculty = await Faculty.findOne({ user: user._id });
    if (faculty) {
      // 1. Link faculty to department
      faculty.department = dept._id;
      faculty.designation = 'HOD';
      await faculty.save();
      console.log('Linked Faculty Rupa to Department Agriculture');

      // 2. Link department to faculty as HOD
      dept.hod = faculty._id;
      await dept.save();
      console.log('Set Faculty Rupa as HOD for Agriculture');
    }
  } else {
    console.log('Could not find Rupa or Agriculture');
  }

  await mongoose.connection.close();
}

fix();
