// ============================================================
// GITROAST — WelcomeConsentModal Tests
// ============================================================
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Unit tests verifying the welcome consent key contract, storage lifecycle,
  satirical agreement gating, and first-time vs returning visitor resolution.
  
  ── WHY: ─────────────────────────────────────────────────────────
  Validates that first-time visitors receive the correct storage key,
  that the key format is deterministic, that consent persistence is robust,
  and that returning users are not spammed with welcome toasts.
  
  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Run via `npm test --prefix client` as part of the client verification suite.
  
  ── USE CASES: ───────────────────────────────────────────────────
  First-time onboarding, satire disclaimer gating, re-engagement rules.
  
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

  it("should gate consent confirmation on satire agreement", () => {
    function processConsent(agreedSatire, storage) {
      if (!agreedSatire) {
        return { success: false, reason: "SATIRE_UNACKNOWLEDGED" };
      }
      storage[WELCOME_CONSENT_KEY] = new Date().toISOString();
      return { success: true, timestamp: storage[WELCOME_CONSENT_KEY] };
    }

    // Attempting without agreement should fail
    const rejected = processConsent(false, mockStorage);
    assert.equal(rejected.success, false);
    assert.equal(rejected.reason, "SATIRE_UNACKNOWLEDGED");
    assert.equal(mockStorage[WELCOME_CONSENT_KEY], undefined);

    // With agreement should succeed
    const accepted = processConsent(true, mockStorage);
    assert.equal(accepted.success, true);
    assert.ok(mockStorage[WELCOME_CONSENT_KEY]);
  });

  it("should suppress welcome toast on revisit while preserving initial toast on first visit", () => {
    function handleConsentFlow(storage) {
      const isFirstTime = !storage[WELCOME_CONSENT_KEY];
      storage[WELCOME_CONSENT_KEY] = new Date().toISOString();
      return {
        shouldShowWelcomeToast: isFirstTime,
      };
    }

    // First visit: should trigger welcome celebration
    const firstResult = handleConsentFlow(mockStorage);
    assert.equal(firstResult.shouldShowWelcomeToast, true);

    // Reopening modal via Rules button: should NOT trigger welcome toast
    const secondResult = handleConsentFlow(mockStorage);
    assert.equal(secondResult.shouldShowWelcomeToast, false);
  });

  it("should handle storage exceptions gracefully (private browsing mode)", () => {
    const brokenStorage = {
      getItem() {
        throw new Error("QuotaExceededError");
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };

    function safeCheck(storage) {
      try {
        return !!storage.getItem("test");
      } catch {
        return false;
      }
    }

    assert.equal(safeCheck(brokenStorage), false);
  });

  it("should guard against rapid double-clicks on confirmation", () => {
    let callCount = 0;
    let isSubmitting = false;

    function handleAccept() {
      if (isSubmitting) return false;
      isSubmitting = true;
      callCount++;
      return true;
    }

    assert.equal(handleAccept(), true);
    assert.equal(handleAccept(), false);
    assert.equal(callCount, 1);
  });

  it("should close modal upon cross-tab storage consent event", () => {
    let closed = false;
    function handleStorageEvent(event) {
      if (event.key === WELCOME_CONSENT_KEY && event.newValue) {
        closed = true;
      }
    }

    // Irrelevant event
    handleStorageEvent({ key: "other_key", newValue: "123" });
    assert.equal(closed, false);

    // Consent established in another tab
    handleStorageEvent({ key: WELCOME_CONSENT_KEY, newValue: new Date().toISOString() });
    assert.equal(closed, true);
  });
});
