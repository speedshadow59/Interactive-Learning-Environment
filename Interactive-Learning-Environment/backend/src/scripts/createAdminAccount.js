require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminAccount() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/interactive-learning-env';
    await mongoose.connect(mongoUri);

    const username = process.env.ADMIN_USERNAME || 'super_admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@ile.local').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'password123';
    const firstName = process.env.ADMIN_FIRST_NAME || 'System';
    const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      existingUser.username = username;
      existingUser.email = email;
      existingUser.password = password;
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      await existingUser.save();

      console.log('Updated existing user to full-access admin account');
    } else {
      await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role: 'admin',
        isActive: true,
        privacyConsent: {
          marketingEmails: false,
          analyticsTracking: false,
          thirdPartySharing: false
        }
      });

      console.log('Created full-access admin account');
    }

    console.log('\nAdmin Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create/update admin account:', error.message);
    process.exit(1);
  }
}

createAdminAccount();
