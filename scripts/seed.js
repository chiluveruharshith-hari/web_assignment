import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

const sampleItems = [
  {
    itemName: 'TI-84 Plus CE Graphing Calculator',
    type: 'lost',
    category: 'Electronics',
    description: 'Black Texas Instruments graphing calculator with a blue slide cover and a small yellow physics formula sticker on the back. Lost during afternoon study session.',
    location: 'Main Campus Library, 2nd Floor Study Room 204',
    incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'sarah.j@campusfind.edu',
    privateDetails: 'Battery compartment contains two rechargeable AAA Energizer batteries.',
    status: 'open'
  },
  {
    itemName: 'Student Campus Identity Card - Alex Morgan',
    type: 'found',
    category: 'ID Cards',
    description: 'Student campus magnetic ID card found on the walkway bench outside the engineering hall.',
    location: 'Engineering Quad Bench outside Hall B',
    incidentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'lostfound-desk@campusfind.edu',
    privateDetails: 'Student ID Number: 2024-CS-0849. Handed over to Campus Security Desk.',
    status: 'open'
  },
  {
    itemName: 'Hydro Flask 32oz Wide Mouth Water Bottle',
    type: 'found',
    category: 'Accessories',
    description: 'Cobalt blue 32oz Hydro Flask with flex straw lid. Has slight scuffing on the bottom rim.',
    location: 'Science Building, Chemistry Lab 301',
    incidentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'lab-assistant@campusfind.edu',
    privateDetails: 'Sticker with a National Park design on the back side.',
    status: 'open'
  },
  {
    itemName: 'Black Fossil Bi-fold Leather Wallet',
    type: 'lost',
    category: 'Bags and Wallets',
    description: 'Black genuine leather bi-fold wallet lost around the varsity basketball court or athletic locker room.',
    location: 'Athletic Center Gymnasium Locker Area',
    incidentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'marcus.t@campusfind.edu',
    privateDetails: 'Contains driver license ending in 4102 and a transit metro card.',
    status: 'open'
  },
  {
    itemName: 'Operating System Concepts (10th Ed.) Textbook',
    type: 'lost',
    category: 'Books and Stationery',
    description: 'Silberschatz Dinosaur Operating System Concepts textbook with yellow sticky notes highlighting chapters 3 and 4.',
    location: 'Student Cafeteria Booth near South Entrance',
    incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'david.k@campusfind.edu',
    privateDetails: 'Name "David Kim - CS302" written in black ink on page 3.',
    status: 'open'
  },
  {
    itemName: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    type: 'found',
    category: 'Electronics',
    description: 'White wireless earbuds in charging case found on the reading desk near the periodicals section.',
    location: 'Library 1st Floor Periodicals Lounge',
    incidentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'desk-librarian@campusfind.edu',
    privateDetails: 'Engraved with initials "E.R." on the lid of the case.',
    status: 'open'
  },
  {
    itemName: 'Grey North Face Fleece Jacket (Size M)',
    type: 'found',
    category: 'Clothing',
    description: 'Medium grey zip-up fleece jacket left on the lecture chair after CS101 morning class.',
    location: 'Auditorium Hall 105, Row E Seat 12',
    incidentDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    contactEmail: 'security@campusfind.edu',
    privateDetails: 'Small silver keychain attached to the right pocket zipper.',
    status: 'returned',
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database for seeding...');

    // 1. Seed or verify Admin user
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@campusfind.edu').toLowerCase().trim();
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const password = process.env.INITIAL_ADMIN_PASSWORD || 'DevAdminPass123';
      const passwordHash = await User.hashPassword(password);
      admin = await User.create({
        name: process.env.INITIAL_ADMIN_NAME || 'Campus Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin'
      });
      console.log(`[Seed] ✅ Created initial Administrator account: ${admin.email}`);
    } else {
      console.log(`[Seed] ℹ️ Administrator account already exists: ${admin.email}`);
    }

    // 2. Seed sample student user
    const studentEmail = 'alex.student@campusfind.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const passwordHash = await User.hashPassword('StudentPass123!');
      student = await User.create({
        name: 'Alex Morgan',
        email: studentEmail,
        passwordHash,
        role: 'student'
      });
      console.log(`[Seed] ✅ Created sample Student account: ${student.email}`);
    }

    // 3. Check existing items
    const itemCount = await Item.countDocuments();
    if (itemCount === 0 || process.argv.includes('--force')) {
      if (process.argv.includes('--force')) {
        await Item.deleteMany({});
        await Claim.deleteMany({});
        console.log('[Seed] Cleared existing items and claims due to --force flag.');
      }

      console.log('[Seed] Seeding realistic lost and found reports...');
      for (const itemData of sampleItems) {
        await Item.create({
          ...itemData,
          owner: admin._id
        });
      }
      console.log(`[Seed] ✅ Seeded ${sampleItems.length} realistic campus reports.`);
    } else {
      console.log(`[Seed] ℹ️ Database already contains ${itemCount} reports. Skipping item seeding.`);
    }

    console.log('\n[Seed] Complete! Default Credentials:');
    console.log('----------------------------------------------------');
    console.log(`Admin User:   ${adminEmail}  /  Password: ${process.env.INITIAL_ADMIN_PASSWORD || 'DevAdminPass123'}`);
    console.log(`Student User: alex.student@campusfind.edu  /  Password: StudentPass123!`);
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
};

// Execute if called directly from CLI
seedDatabase();
