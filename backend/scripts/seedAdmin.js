// -------------------------------------------------------
// Module 6 — Admin Seed Script
// -------------------------------------------------------
// Run this ONCE to create the first admin account.
// Usage: node scripts/seedAdmin.js
// -------------------------------------------------------

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@ceylonboutique.com';
    const adminPassword = 'Admin@123456';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role:  ${existingAdmin.role}`);
      console.log('   No changes made.');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName: 'Platform Admin',
      email: adminEmail,
      phone: '0771234567',
      password: adminPassword,
      role: 'admin',
    });

    console.log('');
    console.log('✅ Admin account created successfully!');
    console.log('─────────────────────────────────────');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin`);
    console.log(`   ID:       ${admin._id}`);
    console.log('─────────────────────────────────────');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
