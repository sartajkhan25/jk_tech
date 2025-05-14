require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'sartaj2493@gmail.com' });
    if (adminExists) {
      process.exit(0);
    }

    const adminUser = new User({
      role: 'admin',
      password: 'admin123',
      email: 'sartaj2493@gmail.com',
      name: 'Admin',
    });

    await adminUser.save();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdminUser(); 