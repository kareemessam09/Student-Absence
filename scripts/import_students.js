#!/usr/bin/env node
/*
  Script: import_students.js
  Purpose: Import students from an Excel file into the database.
  
  Excel Format Expected:
  Column A: English Name (الإسم باللغة الإنجليزية)
  Column B: Arabic Name (الإسم باللغة العربية)
  Column C: Empty
  Column D: Student Code (e.g., 1362182)
  Column E: Class Name (e.g., KG1-A)

  Usage:
    node scripts/import_students.js <path-to-excel-file>
    
  Example:
    node scripts/import_students.js data/students.xlsx
*/

require('dotenv').config();
const XLSX = require('xlsx');
const connectDB = require('../src/config/database');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');
const path = require('path');
const fs = require('fs');

const importStudents = async (filePath) => {
  try {
    // Validate file path
    if (!filePath) {
      console.error('Error: Please provide the Excel file path');
      console.log('Usage: node scripts/import_students.js <path-to-excel-file>');
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`Reading Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Read first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`Found ${data.length} rows in the Excel file`);
    
    // Debug: Show first few rows to understand structure
    console.log('\nFirst 5 rows (for debugging):');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(`Row ${i}:`, data[i]);
    }
    console.log('');

    // Connect to database
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not set in environment');
      process.exit(1);
    }
    
    await connectDB();
    console.log('Connected to database');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`Starting to process rows from index 1 to ${data.length - 1}...`);

    // Process each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0] && !row[2]) {
        console.log(`Row ${i + 1}: Skipping - Empty row`);
        continue;
      }

      const englishName = row[2]?.toString().trim();
      const arabicName = row[3]?.toString().trim();
      const studentCode = row[5]?.toString().trim();
      const className = row[6]?.toString().trim();

      // Debug first few rows
      if (i <= 3) {
        console.log(`\nProcessing Row ${i + 1}:`);
        console.log(`  English: "${englishName}"`);
        console.log(`  Arabic: "${arabicName}"`);
        console.log(`  Code: "${studentCode}"`);
        console.log(`  Class: "${className}"`);
      }

      // Validate required fields
      if (!englishName || !studentCode || !className) {
        console.log(`Row ${i + 1}: Skipping - Missing required fields`);
        skipped++;
        continue;
      }

      try {
        // Find the class by name
        const classDoc = await Class.findOne({ name: className });
        
        if (!classDoc) {
          console.log(`Row ${i + 1}: Error - Class "${className}" not found. Please create it first.`);
          errors++;
          continue;
        }

        // Use English name as primary (nama field), store both
        const primaryName = englishName || arabicName;

        // Check if student already exists
        const existingStudent = await Student.findOne({ studentCode });
        
        if (existingStudent) {
          // Update existing student
          existingStudent.nama = primaryName;
          existingStudent.nameEnglish = englishName || null;
          existingStudent.nameArabic = arabicName || null;
          existingStudent.class = classDoc._id;
          existingStudent.isActive = true;
          await existingStudent.save();
          
          console.log(`Row ${i + 1}: Updated - ${englishName} / ${arabicName} (${studentCode}) → ${className}`);
        } else {
          // Create new student
          const newStudent = await Student.create({
            studentCode,
            nama: primaryName,
            nameEnglish: englishName || null,
            nameArabic: arabicName || null,
            class: classDoc._id,
            isActive: true
          });
          
          console.log(`Row ${i + 1}: Created - ${englishName} / ${arabicName} (${studentCode}) → ${className}`);
        }
        
        imported++;
        
      } catch (error) {
        console.error(`Row ${i + 1}: Error - ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Import Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported/updated: ${imported}`);
    console.log(`⚠️  Skipped (missing data): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    process.exit(0);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: Please provide the Excel file path');
  console.log('\nUsage:');
  console.log('  node scripts/import_students.js <path-to-excel-file>');
  console.log('\nExample:');
  console.log('  node scripts/import_students.js data/students.xlsx');
  console.log('  node scripts/import_students.js /path/to/students.xlsx');
  process.exit(1);
}

// Run the import
importStudents(filePath);
