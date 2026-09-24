// ============================================================
// GITROAST — ContactMessage Model
// ============================================================
// WHAT: Stores user feedback, bug reports, Pro inquiries, and dispute
//       messages dispatched through the Contact page.
// WHY:
//   - Real triage: Messages are persisted for creator review.
//   - Reference ticket: Generates unique ticketId (e.g. GR-849201).
//   - Audit trail: Tracks category, IP, user-agent, priority, and status.
// ============================================================

const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["feedback", "bug", "pro", "dispute", "general"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Anonymous Developer",
    },
    email: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    emailDelivered: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["unread", "investigating", "resolved"],
      default: "unread",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for support queues and ticket lookups
contactMessageSchema.index({ status: 1, priority: -1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
