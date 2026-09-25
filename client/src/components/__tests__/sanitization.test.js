// ============================================================
// GITROAST — Client Input Sanitization Tests
// ============================================================
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Unit tests validating client-side GitHub username and repository URL sanitizers.
  
  ── WHY: ─────────────────────────────────────────────────────────
  Users paste various formats (full URLs, www subdomains, trailing slashes, leading @).
  Testing this logic ensures form submissions never submit malformed slugs that 404.
  
  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Run via `npm test --prefix client` before client build.
  
  ── USE CASES: ───────────────────────────────────────────────────
  Input fields in UsernameInput.jsx and BattleEntryClient.jsx.
  
  ── WHEN NOT TO USE: ─────────────────────────────────────────────
  Backend database sanitization.
*/

import { describe, it } from "node:test";
import assert from "node:assert/strict";

function sanitizeGitHubInput(input) {
  let val = (input || "").trim();
  val = val
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/^(?:www\.)?github\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/^\/+|\/+$/g, "");
  return val;
}

describe("Client Input Sanitization", () => {
  it("should strip https://github.com/ prefix", () => {
    assert.equal(sanitizeGitHubInput("https://github.com/torvalds"), "torvalds");
  });

  it("should strip https://www.github.com/ prefix", () => {
    assert.equal(sanitizeGitHubInput("https://www.github.com/gaearon"), "gaearon");
  });

  it("should strip www.github.com/ without protocol", () => {
    assert.equal(sanitizeGitHubInput("www.github.com/shadcn"), "shadcn");
  });

  it("should strip github.com/ without protocol", () => {
    assert.equal(sanitizeGitHubInput("github.com/facebook/react"), "facebook/react");
  });

  it("should strip leading @ symbols and trailing slashes", () => {
    assert.equal(sanitizeGitHubInput("@rich-harris/"), "rich-harris");
    assert.equal(sanitizeGitHubInput("///vercel/next.js///"), "vercel/next.js");
  });

  it("should preserve plain usernames and repository slugs", () => {
    assert.equal(sanitizeGitHubInput("sindresorhus"), "sindresorhus");
    assert.equal(sanitizeGitHubInput("expressjs/express"), "expressjs/express");
  });
});
