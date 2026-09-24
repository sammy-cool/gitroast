// ============================================================
// GITROAST — Client Constants Interface
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Client-side export interface linking to the single source of truth in `shared/constants.js`.
//
// ── WHY: ─────────────────────────────────────────────────────
// Ensures Next.js bundling resolves shared domain contracts cleanly with zero duplication.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Import in client components, forms, and service wrappers.
//
// ── USE CASES: ───────────────────────────────────────────────
// Input regex validation, intensity options, and reaction classifications.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not modify these values independently of `shared/constants.js`.
// ============================================================

import shared from "../../../shared/constants";

export const {
  USERNAME_REGEX,
  INTENSITY_LEVELS,
  DEFAULT_INTENSITY,
  ROAST_REACTION_TYPES,
  BATTLE_REACTION_TYPES,
  ALL_REACTION_TYPES,
  ROAST_GRADES,
  ERROR_CODES,
} = shared;

export default shared;
