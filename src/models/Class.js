const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a class name"],
      trim: true,
      maxlength: [100, "Class name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a teacher"],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    capacity: {
      type: Number,
      default: 30,
      min: [1, "Capacity must be at least 1"],
      max: [100, "Capacity cannot exceed 100"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
classSchema.index({ name: 1 });
classSchema.index({ teacher: 1 });
classSchema.index({ isActive: 1 });

// Virtual for student count
classSchema.virtual("studentCount").get(function () {
  return this.students ? this.students.length : 0;
});

// Virtual for available spots
classSchema.virtual("availableSpots").get(function () {
  return this.capacity - this.studentCount;
});

// Ensure virtual fields are serialized
classSchema.set("toJSON", { virtuals: true });

// Pre-save middleware to validate capacity
classSchema.pre("save", function (next) {
  if (this.students && this.students.length > this.capacity) {
    return next(new Error("Number of students exceeds class capacity"));
  }
  next();
});

module.exports = mongoose.model("Class", classSchema);
