const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Student = require("./models/Student");
const Class = require("./models/Class");
const Notification = require("./models/Notification");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Notification.deleteMany({});

    // Create Users
    console.log("👥 Creating users...");
    // Don't hash password here - the User model will do it automatically
    const password = "password123";

    const manager = await User.create({
      name: "Admin Manager",
      email: "manager@school.com",
      password: password,
      role: "manager",
      isActive: true,
    });

    const teacher1 = await User.create({
      name: "John Smith",
      email: "teacher1@school.com",
      password: password,
      role: "teacher",
      isActive: true,
    });

    const teacher2 = await User.create({
      name: "Sarah Johnson",
      email: "teacher2@school.com",
      password: password,
      role: "teacher",
      isActive: true,
    });

    const receptionist = await User.create({
      name: "Mary Brown",
      email: "receptionist@school.com",
      password: password,
      role: "receptionist",
      isActive: true,
    });

    console.log("✅ Created 4 users (1 manager, 2 teachers, 1 receptionist)");

    // Create Classes
    console.log("📚 Creating classes...");
    const class1 = await Class.create({
      name: "Mathematics 101",
      description: "Basic mathematics for beginners",
      teacher: teacher1._id,
      capacity: 30,
      isActive: true,
      startDate: new Date("2024-09-01"),
    });

    const class2 = await Class.create({
      name: "Physics 101",
      description: "Introduction to Physics",
      teacher: teacher1._id,
      capacity: 25,
      isActive: true,
      startDate: new Date("2024-09-01"),
    });

    const class3 = await Class.create({
      name: "English Literature",
      description: "Classic and modern literature",
      teacher: teacher2._id,
      capacity: 20,
      isActive: true,
      startDate: new Date("2024-09-01"),
    });

    console.log("✅ Created 3 classes");

    // Create Students
    console.log("👨‍🎓 Creating students...");
    const students = [];

    const studentData = [
      { code: "STU001", name: "Ahmed Ali", class: class1._id },
      { code: "STU002", name: "Fatima Hassan", class: class1._id },
      { code: "STU003", name: "Mohammed Salem", class: class1._id },
      { code: "STU004", name: "Aisha Ibrahim", class: class2._id },
      { code: "STU005", name: "Omar Khalil", class: class2._id },
      { code: "STU006", name: "Layla Mahmoud", class: class2._id },
      { code: "STU007", name: "Yousef Ahmed", class: class3._id },
      { code: "STU008", name: "Nour Adel", class: class3._id },
      { code: "STU009", name: "Karim Fathy", class: class3._id },
      { code: "STU010", name: "Maryam Said", class: class1._id },
    ];

    for (const data of studentData) {
      const student = await Student.create({
        studentCode: data.code,
        nama: data.name,
        class: data.class,
        isActive: true,
        enrollmentDate: new Date("2024-09-01"),
      });
      students.push(student);
    }

    // Update classes with students
    await Class.findByIdAndUpdate(class1._id, {
      students: students.filter((s) =>
        [studentData[0].code, studentData[1].code, studentData[2].code, studentData[9].code].includes(s.studentCode)
      ).map(s => s._id),
    });

    await Class.findByIdAndUpdate(class2._id, {
      students: students.filter((s) =>
        [studentData[3].code, studentData[4].code, studentData[5].code].includes(s.studentCode)
      ).map(s => s._id),
    });

    await Class.findByIdAndUpdate(class3._id, {
      students: students.filter((s) =>
        [studentData[6].code, studentData[7].code, studentData[8].code].includes(s.studentCode)
      ).map(s => s._id),
    });

    console.log("✅ Created 10 students");

    // Create Sample Notifications
    console.log("🔔 Creating sample notifications...");
    await Notification.create({
      from: receptionist._id,
      to: teacher1._id,
      student: students[0]._id,
      class: class1._id,
      type: "request",
      status: "pending",
      message: "Is Ahmed Ali present in class today?",
      isRead: false,
    });

    await Notification.create({
      from: receptionist._id,
      to: teacher2._id,
      student: students[6]._id,
      class: class3._id,
      type: "request",
      status: "approved",
      message: "Can Yousef Ahmed leave early today?",
      responseMessage: "Yes, he can leave at 2 PM",
      isRead: true,
      responseDate: new Date(),
    });

    console.log("✅ Created 2 sample notifications");

    console.log("\n🎉 Database seeded successfully!\n");
    console.log("📝 Test Credentials:");
    console.log("=".repeat(50));
    console.log("Manager:      manager@school.com / password123");
    console.log("Teacher 1:    teacher1@school.com / password123");
    console.log("Teacher 2:    teacher2@school.com / password123");
    console.log("Receptionist: receptionist@school.com / password123");
    console.log("=".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Students: ${await Student.countDocuments()}`);
    console.log(`- Classes: ${await Class.countDocuments()}`);
    console.log(`- Notifications: ${await Notification.countDocuments()}`);
    console.log("\n🚀 You can now test the API at: http://localhost:3000");
    console.log("📖 API Documentation: http://localhost:3000/api-docs\n");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log("✅ Database connection closed");
  process.exit(0);
};

run();
