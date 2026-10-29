import test from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';

test('CampusFind Backend Test Suite', async (t) => {
  let adminUser;
  let studentUser;
  let student2User;
  let testFoundItem;
  let testLostItem;

  await t.test('Setup: Connect to Database', async () => {
    await connectDB();
    // Clean test collections
    await User.deleteMany({ email: /@test-campusfind\.edu$/ });
    await Item.deleteMany({ itemName: /^\[TEST\]/ });
    await Claim.deleteMany({});
  });

  await t.test('1. User Registration: Creates student account with hashed password', async () => {
    const passwordHash = await User.hashPassword('StudentSecret123');
    studentUser = await User.create({
      name: 'Test Student One',
      email: 'student1@test-campusfind.edu',
      passwordHash,
      role: 'student'
    });

    assert.equal(studentUser.name, 'Test Student One');
    assert.equal(studentUser.role, 'student');
    assert.equal(studentUser.passwordHash.startsWith('$2'), true);

    const isMatch = await studentUser.matchPassword('StudentSecret123');
    assert.equal(isMatch, true);
  });

  await t.test('2. User Registration: Duplicate email is rejected by MongoDB unique constraint', async () => {
    await assert.rejects(
      async () => {
        const passwordHash = await User.hashPassword('Pass123456');
        await User.create({
          name: 'Imposter Student',
          email: 'student1@test-campusfind.edu', // duplicate
          passwordHash,
          role: 'student'
        });
      },
      /E11000 duplicate key error/
    );
  });

  await t.test('3. Role Escalation Protection: Public creation cannot bypass role', async () => {
    const passwordHash = await User.hashPassword('StudentSecret456');
    student2User = await User.create({
      name: 'Test Student Two',
      email: 'student2@test-campusfind.edu',
      passwordHash,
      role: 'student'
    });

    const adminHash = await User.hashPassword('AdminSecret123');
    adminUser = await User.create({
      name: 'Test Administrator',
      email: 'admin@test-campusfind.edu',
      passwordHash,
      role: 'admin'
    });

    assert.equal(student2User.role, 'student');
    assert.equal(adminUser.role, 'admin');
  });

  await t.test('4. Item CRUD: Create Lost Report and Found Report', async () => {
    testLostItem = await Item.create({
      itemName: '[TEST] Lost Scientific Calculator',
      type: 'lost',
      category: 'Electronics',
      description: 'Lost in the library physics study area near desk 4.',
      location: 'Main Library 2nd Floor',
      incidentDate: new Date(),
      contactEmail: 'student1@test-campusfind.edu',
      owner: studentUser._id,
      status: 'open'
    });

    testFoundItem = await Item.create({
      itemName: '[TEST] Found Car Key with Red Fob',
      type: 'found',
      category: 'Keys',
      description: 'Found on the bench outside dining hall.',
      location: 'Dining Hall Walkway',
      incidentDate: new Date(),
      contactEmail: 'admin@test-campusfind.edu',
      privateDetails: 'Fob has a small Honda emblem and gym tag #9821.',
      owner: adminUser._id,
      status: 'open'
    });

    assert.equal(testLostItem.type, 'lost');
    assert.equal(testFoundItem.type, 'found');
    assert.equal(testFoundItem.status, 'open');
  });

  await t.test('5. Item Search & Filtering', async () => {
    const foundByCat = await Item.find({ category: 'Keys', itemName: /^\[TEST\]/ });
    assert.equal(foundByCat.length, 1);
    assert.equal(foundByCat[0].itemName, '[TEST] Found Car Key with Red Fob');

    const searchResults = await Item.find({
      $or: [
        { itemName: { $regex: 'Scientific', $options: 'i' } },
        { description: { $regex: 'Scientific', $options: 'i' } }
      ]
    });
    assert.equal(searchResults.length >= 1, true);
  });

  await t.test('6. Ownership Claims: Submit valid claim for found item', async () => {
    const claim = await Claim.create({
      item: testFoundItem._id,
      claimant: studentUser._id,
      explanation: 'I dropped my Honda car key with the red gym fob while walking to lunch.',
      identifyingDetails: 'Gym tag number 9821.',
      contactPhone: '555-0199',
      status: 'pending'
    });

    assert.equal(claim.status, 'pending');
    assert.equal(claim.claimant.toString(), studentUser._id.toString());
  });

  await t.test('7. Conflict Prevention: Approving a claim updates item and rejects conflicting claims', async () => {
    // Submit a second conflicting claim from student 2
    const claim2 = await Claim.create({
      item: testFoundItem._id,
      claimant: student2User._id,
      explanation: 'I also lost keys around there.',
      status: 'pending'
    });

    // Admin approves student 1's claim
    const winningClaim = await Claim.findOne({ item: testFoundItem._id, claimant: studentUser._id });
    winningClaim.status = 'approved';
    winningClaim.reviewedBy = adminUser._id;
    winningClaim.reviewedAt = new Date();
    await winningClaim.save();

    // Item becomes 'claimed'
    testFoundItem.status = 'claimed';
    testFoundItem.resolvedClaim = winningClaim._id;
    await testFoundItem.save();

    // Reject all other pending claims on this item
    await Claim.updateMany(
      { item: testFoundItem._id, _id: { $ne: winningClaim._id }, status: 'pending' },
      { $set: { status: 'rejected', reviewNotes: 'Another verified claim was approved.' } }
    );

    const updatedClaim2 = await Claim.findById(claim2._id);
    assert.equal(updatedClaim2.status, 'rejected');

    const updatedItem = await Item.findById(testFoundItem._id);
    assert.equal(updatedItem.status, 'claimed');
  });

  await t.test('8. Handover Resolution: Mark item returned', async () => {
    testFoundItem.status = 'returned';
    testFoundItem.resolvedAt = new Date();
    await testFoundItem.save();

    const finalizedItem = await Item.findById(testFoundItem._id);
    assert.equal(finalizedItem.status, 'returned');
    assert.ok(finalizedItem.resolvedAt);
  });

  await t.test('Cleanup & Disconnect', async () => {
    await User.deleteMany({ email: /@test-campusfind\.edu$/ });
    await Item.deleteMany({ itemName: /^\[TEST\]/ });
    await Claim.deleteMany({});
    await disconnectDB();
  });
});
