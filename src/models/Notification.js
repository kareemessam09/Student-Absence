const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide sender"],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide recipient"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Please provide student"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Please provide class"],
    },
    type: {
      type: String,
      enum: ["request", "response", "message"],
      required: [true, "Please provide notification type"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "absent", "present"],
      default: "pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot be more than 500 characters"],
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Response message cannot be more than 500 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ from: 1 });
notificationSchema.index({ to: 1 });
notificationSchema.index({ student: 1 });
notificationSchema.index({ class: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ requestDate: -1 });

// Virtual for notification summary
notificationSchema.virtual("summary").get(function () {
  if (this.type === "request") {
    return `Request for student ${this.student?.nama || "Unknown"} in class ${
      this.class?.name || "Unknown"
    }`;
  } else if (this.type === "response") {
    return `Response: ${this.status} for student ${
      this.student?.nama || "Unknown"
    }`;
  }
  return this.message || "Message";
});

// Ensure virtual fields are serialized
notificationSchema.set("toJSON", { virtuals: true });

// Pre-save middleware to set response date
notificationSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status !== "pending" &&
    !this.responseDate
  ) {
    this.responseDate = new Date();
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
