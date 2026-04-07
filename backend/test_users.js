require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log(users.map(u => ({ email: u.email, role: u.role })));
  await mongoose.connection.close();
}

test();
