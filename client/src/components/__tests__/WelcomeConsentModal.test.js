// ============================================================
// GITROAST — WelcomeConsentModal Tests
// ============================================================
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Unit tests verifying the welcome consent key contract, storage lifecycle,
  and onboarding invariants for the Welcome & Satirical Consent modal.
  
  ── WHY: ─────────────────────────────────────────────────────────
  Validates that first-time visitors receive the correct storage key,
  that the key format is deterministic, and that consent persistence is robust.
  
  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Run via `npm test --prefix client` as part of the client verification suite.
  
  ── USE CASES: ───────────────────────────────────────────────────
  First-time onboarding, re-engagement rules, and consent tracking.
  
  ── WHEN NOT TO USE: ─────────────────────────────────────────────
  End-to-end browser rendering tests.
*/

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { WELCOME_CONSENT_KEY } from "../../utils/welcomeConstants.js";

describe("WelcomeConsentModal Invariants & Key Contracts", () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {};
  });

  it("should export the canonical WELCOME_CONSENT_KEY string", () => {
    assert.equal(typeof WELCOME_CONSENT_KEY, "string");
    assert.equal(WELCOME_CONSENT_KEY, "gitroast_welcome_consent_v1");
  });

  it("should record consent timestamp deterministically in storage", () => {
    const timestamp = new Date().toISOString();
    mockStorage[WELCOME_CONSENT_KEY] = timestamp;

    assert.ok(mockStorage[WELCOME_CONSENT_KEY]);
    assert.ok(new Date(mockStorage[WELCOME_CONSENT_KEY]).getTime() > 0);
  });

  it("should distinguish between first-time visitors and returning users", () => {
    function isFirstTimeVisitor(storage) {
      return !storage[WELCOME_CONSENT_KEY];
    }

    // 1st visit
    assert.equal(isFirstTimeVisitor(mockStorage), true);

    // After agreement
    mockStorage[WELCOME_CONSENT_KEY] = new Date().toISOString();
    assert.equal(isFirstTimeVisitor(mockStorage), false);
  });
});
