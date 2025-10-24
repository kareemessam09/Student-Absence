const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentCode: {
      type: String,
      required: [true, "Please provide a student code"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9]+$/,
        "Student code must contain only uppercase letters and numbers",
      ],
    },
    nama: {
      type: String,
      required: [true, "Please provide student name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    nameArabic: {
      type: String,
      trim: true,
      maxlength: [100, "Arabic name cannot be more than 100 characters"],
    },
    nameEnglish: {
      type: String,
      trim: true,
      maxlength: [100, "English name cannot be more than 100 characters"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Please provide a class"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
studentSchema.index({ studentCode: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ isActive: 1 });

// Virtual for full student info
studentSchema.virtual("fullInfo").get(function () {
  return `${this.nama} (${this.studentCode})`;
});

// Ensure virtual fields are serialized
studentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Student", studentSchema);
