#!/usr/bin/env node
/*
  Script: sync_class_students.js
  Purpose: Sync students to their class's students array
  
  This script reads all students and adds them to their respective class's students array.
  
  Usage:
    node scripts/sync_class_students.js
*/

require('dotenv').config();
const connectDB = require('../src/config/database');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');

const syncClassStudents = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students`);

    // Reset all class student arrays
    await Class.updateMany({}, { $set: { students: [] } });
    console.log('Reset all class student arrays');

    // Group students by class
    const studentsByClass = {};
    students.forEach(student => {
      const classId = student.class.toString();
      if (!studentsByClass[classId]) {
        studentsByClass[classId] = [];
      }
      studentsByClass[classId].push(student._id);
    });

    console.log(`\nSyncing students to ${Object.keys(studentsByClass).length} classes...\n`);

    let updated = 0;
    let errors = 0;

    // Update each class with its students
    for (const [classId, studentIds] of Object.entries(studentsByClass)) {
      try {
        const classDoc = await Class.findById(classId);
        
        if (!classDoc) {
          console.log(`Error: Class ${classId} not found`);
          errors++;
          continue;
        }

        // Update without validation (in case it exceeds capacity)
        await Class.findByIdAndUpdate(
          classId,
          { $set: { students: studentIds } },
          { validateBeforeSave: false }
        );

        console.log(`✅ ${classDoc.name}: Added ${studentIds.length} students`);
        updated++;

      } catch (error) {
        console.error(`Error updating class ${classId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Sync Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Classes updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    // Show class breakdown
    console.log('\nClass Student Counts:');
    const classes = await Class.find({}).sort({ name: 1 });
    for (const classDoc of classes) {
      console.log(`  ${classDoc.name}: ${classDoc.students.length} students`);
    }

    process.exit(0);
    
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
};

// Run the sync
syncClassStudents();
