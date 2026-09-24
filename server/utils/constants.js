// ============================================================
// GITROAST — Server Constants Interface
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Server-side export interface linking to the single source of truth in `shared/constants.js`.
//
// ── WHY: ─────────────────────────────────────────────────────
// Ensures Express routes and Mongoose schemas consume canonical domain constants.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Import in server controllers, validation middleware, and schema definitions.
//
// ── USE CASES: ───────────────────────────────────────────────
// Schema enum validation, error envelopes, and request query validation.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not modify these values independently of `shared/constants.js`.
// ============================================================

module.exports = require("../../shared/constants");
