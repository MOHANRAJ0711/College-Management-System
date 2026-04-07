const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const agDept = await Department.findOne({ name: 'Agriculture' });
  if (!agDept) {
    console.log('Agriculture department not found');
    return;
  }

  // Update all other faculty members to Agriculture
  const result = await Faculty.updateMany(
    { name: { $ne: 'Rupa' } }, // Everyone except Rupa (though we could include her too)
    { $set: { department: agDept._id } }
  );

  console.log(`Updated ${result.modifiedCount} faculty to Agriculture department`);
  await mongoose.disconnect();
}

fix();
