#!/usr/bin/env node
/*
  Script: import_classes.js
  Purpose: Upsert classes and their capacities into the database.
  Usage:
    # ensure MONGODB_URI is set in env or .env
    node scripts/import_classes.js
    or
    ./scripts/import_classes.js
*/

require('dotenv').config();
const connectDB = require('../src/config/database');
const Class = require('../src/models/Class');

const csvData = `
G1-A,35
G1-B,36
G1-C,36
G10-A,33
G10-B,33
G10-C,31
G11-A,35
G11-B,35
G12-A,33
G12-B,30
G12-C,33
G2-A,36
G3-A,32
G3-B,34
G3-C,33
G3-D,33
G4-A,33
G4-B,32
G4-C,32
G4-D,32
G5-A,31
G5-B,31
G5-C,29
G6-A,36
G6-B,34
G6-C,35
G6-D,35
G6-E,35
G7-A,36
G7-B,35
G7-C,35
G7-D,36
G8-A,36
G8-B,34
G8-C,35
G8-D,35
G9-A,28
G9-B,29
G9-C,28
G9-D,31
KG1-A,35
KG1-B,35
KG1-C,20
KG2-A,35
KG2-B,36
KG2-C,36
V-G10,7
V-G11,2
V-G12,3
V-G3,5
V-G4,6
V-G5,1
V-G6,4
V-G7,3
V-G8,2
V-G9,5
`;

const parseCSV = (csv) => {
  return csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(',');
      const name = parts[0].trim();
      const capacity = Number(parts[1].trim());
      return { name, capacity };
    });
};

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not set in environment. Please set it or create a .env file.');
      process.exit(1);
    }

    await connectDB();

    const classes = parseCSV(csvData);
    console.log(`Found ${classes.length} classes to import`);

    let inserted = 0;
    for (const item of classes) {
      const { name, capacity } = item;

      const updated = await Class.findOneAndUpdate(
        { name },
        { $set: { capacity, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`Upserted: ${updated.name} (capacity: ${updated.capacity})`);
      inserted++;
    }

    console.log(`\nDone. Upserted ${inserted} classes.`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
};

run();
