// ============================================================
// GITROAST — Shared System Constants & Validation Contracts
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Single source of truth defining cross-tier domain constants:
// • Username validation regexes and character constraints
// • Roast burn intensity levels (mild, savage, nuclear)
// • Reaction classifications (savage, destroyed, fire, skull, clown)
// • Academic letter grade benchmarks (A through F-)
// • Standardized API error codes
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Contract Synchronization: Prevents drift between Next.js client inputs and Express validation.
// 2. DRY (Don't Repeat Yourself): Updates to valid characters or enum lists occur in ONE place.
// 3. Type & Domain Safety: Guarantees that both client forms and MongoDB schema models agree.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • In server validation middleware, Mongoose schema enum arrays, and route controllers.
// • In client form validators (`UsernameInput.jsx`, `LandingPageClient.jsx`, `roastService.js`).
//
// ── USE CASES: ───────────────────────────────────────────────
// • Validating username format before sending fetch request.
// • Verifying reaction types in `POST /api/history/:id/react` and `POST /api/battle/:id/react`.
// • Populating intensity selector options.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT store secrets, environment-dependent URLs, or credentials in this file.
// ============================================================

/**
 * Valid GitHub username pattern:
 * - Alphanumeric with single hyphens, dots, or underscores
 * - Max length 39 characters (GitHub standard limit)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9-._]+$/;

/**
 * Burn intensity tiers supported by GitRoast
 */
const INTENSITY_LEVELS = ["mild", "savage", "nuclear"];
const DEFAULT_INTENSITY = "savage";

/**
 * Standardized reaction types supported across Roasts and Battles
 */
const ROAST_REACTION_TYPES = ["savage", "destroyed"];
const BATTLE_REACTION_TYPES = ["fire", "skull", "clown"];
const ALL_REACTION_TYPES = [...ROAST_REACTION_TYPES, ...BATTLE_REACTION_TYPES];

/**
 * Academic roast grades calculated from score (1-100)
 */
const ROAST_GRADES = ["A", "B", "C", "D", "F", "F-"];

/**
 * Standardized API Error Codes returned across endpoints
 */
const ERROR_CODES = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ORGANIZATION_NOT_SUPPORTED: "ORGANIZATION_NOT_SUPPORTED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
  CAPTCHA_FAILED: "CAPTCHA_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  PRO_REQUIRED: "PRO_REQUIRED",
  INVALID_ID: "INVALID_ID",
  INVALID_TYPE: "INVALID_TYPE",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  SERVER_ERROR: "SERVER_ERROR",
};

// Universal module export supporting CommonJS (Node.js) and ES module environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    USERNAME_REGEX,
    INTENSITY_LEVELS,
    DEFAULT_INTENSITY,
    ROAST_REACTION_TYPES,
    BATTLE_REACTION_TYPES,
    ALL_REACTION_TYPES,
    ROAST_GRADES,
    ERROR_CODES,
  };
}
