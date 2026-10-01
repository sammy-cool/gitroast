const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ============================================================
// GITROAST — Recruiter Model
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Mongoose schema for the Recruiter entity. Represents corporate
// users (recruiters, hiring managers) looking for talent.
// 
// ── WHY: ─────────────────────────────────────────────────────
// Keeps recruiter data completely isolated from standard developer (User) 
// data. Developers authenticate via GitHub; Recruiters authenticate
// via Google OAuth or traditional Email/Password.
// ============================================================

const recruiterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    role: {
      type: String,
      default: "recruiter",
    },
    savedCandidates: [
      {
        username: { type: String, required: true },
        savedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// ── comparePassword ───────────────────────────────────────────
// ── WHAT: Asynchronously compares a raw password against the stored bcrypt hash.
// ── WHY: Enables secure traditional login without leaking password hashing logic 
//         into route controllers.
recruiterSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ── toSafeObject ──────────────────────────────────────────────
// ── WHAT: Returns a sanitized version of the Recruiter document.
// ── WHY: Ensures sensitive data (like password hashes) is never accidentally 
//         sent to the frontend in API responses.
recruiterSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Recruiter", recruiterSchema);
