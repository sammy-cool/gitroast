// ============================================================
// GITROAST — ContactMessage Model
// ============================================================
// WHAT: Stores user feedback, bug reports, Pro inquiries, and dispute
//       messages dispatched through the Contact page.
// WHY:
//   - Real triage: Messages are persisted for creator review.
//   - Reference ticket: Generates unique ticketId (e.g. GR-849201).
//   - Audit trail: Tracks category, IP, user-agent, and status.
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
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["unread", "investigating", "resolved"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
