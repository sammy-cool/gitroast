// ============================================================
// GITROAST — Client Service Unit Tests
// ============================================================
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Unit tests for client API service gateway (roastService.js).
  
  ── WHY: ─────────────────────────────────────────────────────────
  Validates that frontend API wrappers formulate correct URL endpoints,
  headers, fallback behaviors, 429 Retry-After extractions, HTML 502/504
  gateway error tolerance, and backward-compatible function aliases.
  
  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Executed via `npm test --prefix client` prior to all deployments.
  
  ── USE CASES: ───────────────────────────────────────────────────
  Verifying client API resiliency against cold-start HTML error payloads,
  query param encodings, and network exceptions.
  
  ── WHEN NOT TO USE: ─────────────────────────────────────────────
  Do not use to test real external network calls (mocks global fetch).
*/

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  getRoast,
  getRoastHistory,
  getBattle,
  getBattleRoast,
  getDailyBurn,
  getRoastOfTheDay,
  reactToRoast,
  reactToBattle,
  getLeaderboard,
  searchLeaderboard,
  getRateLimitStatus,
  dispatchContactMessage,
  updateUserPreferences,
} from "../roastService.js";

const originalFetch = global.fetch;

describe("Client Service Layer — roastService.js", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should extract retryAfter and code on 429 rate limit response", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => JSON.stringify({
        error: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit reached. Try again in 45s.",
        retryAfter: 45,
      }),
    });

    await assert.rejects(
      async () => {
        await getRoast("torvalds");
      },
      (err) => {
        assert.equal(err.code, "RATE_LIMIT_EXCEEDED");
        assert.equal(err.status, 429);
        assert.equal(err.retryAfter, 45);
        return true;
      }
    );
  });

  it("should handle HTML 502/504 gateway timeout without crashing JSON parser", async () => {
    // Cloudflare / Render cold starts emit HTML 502 Bad Gateway
    global.fetch = async () => ({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "<html><body>502 Bad Gateway: Upstream Server Down</body></html>",
    });

    await assert.rejects(
      async () => {
        await getRoast("rich-harris");
      },
      (err) => {
        assert.equal(err.status, 502);
        assert.match(err.message, /502 Bad Gateway/);
        return true;
      }
    );
  });

  it("should safely return null on failed emoji reactions without throwing", async () => {
    global.fetch = async () => {
      throw new Error("Network offline");
    };

    const roastResult = await reactToRoast("roast-123", "savage");
    assert.equal(roastResult, null);

    const battleResult = await reactToBattle("battle-123", "destroyed");
    assert.equal(battleResult, null);
  });

  it("should export getBattle and getDailyBurn matching underlying implementations", () => {
    assert.equal(getBattle, getBattleRoast);
    assert.equal(getDailyBurn, getRoastOfTheDay);
  });

  it("should fetch rate limit status with optional auth header", async () => {
    let capturedUrl = "";
    let capturedAuth = "";

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedAuth = options?.headers?.["Authorization"] || "";
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          success: true,
          authenticated: true,
          isPro: true,
          remainingToday: "unlimited",
        }),
      };
    };

    const status = await getRateLimitStatus("test-jwt-token");
    assert.match(capturedUrl, /\/api\/roast\/rate-limit-status$/);
    assert.equal(capturedAuth, "Bearer test-jwt-token");
    assert.equal(status.isPro, true);
    assert.equal(status.remainingToday, "unlimited");
  });

  it("should properly URI-encode search queries and usernames", async () => {
    let searchUrl = "";
    global.fetch = async (url) => {
      searchUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, results: [] }),
      };
    };

    await searchLeaderboard("foo bar/test?special=1");
    assert.match(searchUrl, /q=foo%20bar%2Ftest%3Fspecial%3D1/);
  });

  it("should append ?rematch=true when rematch flag is true in getBattleRoast", async () => {
    let capturedUrl = "";
    global.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: { user1: "alice", user2: "bob" } }),
      };
    };

    await getBattleRoast("alice", "bob", "fake-token", true);
    assert.match(capturedUrl, /\/api\/battle\/alice\/vs\/bob\?rematch=true$/);

    await getBattleRoast("alice", "bob", "fake-token", false);
    assert.match(capturedUrl, /\/api\/battle\/alice\/vs\/bob$/);
  });

  it("should append persona and intensity query parameters in getRoast", async () => {
    let capturedUrl = "";
    global.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: { username: "torvalds", score: 85 } }),
      };
    };

    await getRoast("torvalds", "idemp-key-1", null, "nuclear", "hinglish");
    assert.match(capturedUrl, /\/api\/roast\/torvalds\?intensity=nuclear&persona=hinglish$/);
  });

  it("should send PATCH /api/auth/preferences with authorization token in updateUserPreferences", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedHeaders = {};
    let capturedBody = "";

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedHeaders = options.headers;
      capturedBody = options.body;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          success: true,
          preferences: { defaultPersona: "ramsay", hideFromLeaderboard: true },
        }),
      };
    };

    const res = await updateUserPreferences(
      { defaultPersona: "ramsay", hideFromLeaderboard: true },
      "jwt-session-token"
    );

    assert.match(capturedUrl, /\/api\/auth\/preferences$/);
    assert.equal(capturedMethod, "PATCH");
    assert.equal(capturedHeaders["Authorization"], "Bearer jwt-session-token");
    assert.equal(capturedHeaders["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(capturedBody), {
      defaultPersona: "ramsay",
      hideFromLeaderboard: true,
    });
    assert.equal(res.success, true);
    assert.equal(res.preferences.defaultPersona, "ramsay");
  });
});
