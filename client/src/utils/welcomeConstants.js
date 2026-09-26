// ============================================================
// GITROAST — Welcome & Consent Storage Constants
// ============================================================
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Canonical storage keys for the first-time user welcome & consent modal.

  ── WHY: ─────────────────────────────────────────────────────────
  Decoupled constant module enabling Node native ESM test runner to
  verify contract invariants without requiring a JSX transpilation step.

  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Import in WelcomeConsentModal.jsx, LandingPageClient.jsx, and unit tests.

  ── USE CASES: ───────────────────────────────────────────────────
  Reading and writing the onboarding consent timestamp in localStorage.

  ── WHEN NOT TO USE: ─────────────────────────────────────────────
  Not for temporary session tokens or server-side cookies.
*/

export const WELCOME_CONSENT_KEY = 'gitroast_welcome_consent_v1';
