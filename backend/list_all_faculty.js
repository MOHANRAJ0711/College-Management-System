const mongoose = require('mongoose');
require('./models/Department');
require('./models/User');
const Faculty = require('./models/Faculty');
require('dotenv').config();

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  const allFac = await Faculty.find().populate('user').populate('department');
  console.log(`Total Faculty: ${allFac.length}`);
  allFac.forEach(f => {
    console.log(`- ${f.user?.name || 'Unknown'} | Dept: ${f.department?.name || 'NONE'} | ID: ${f._id}`);
  });
  await mongoose.disconnect();
}

listAll();
