import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanGithubTarget, parseGithubTarget } from "../githubTarget.js";

describe("githubTarget", () => {
  it("normalises handles, urls and .git suffixes", () => {
    assert.equal(cleanGithubTarget("  @octavia-labs "), "octavia-labs");
    assert.equal(cleanGithubTarget("https://github.com/octavia-labs/ember/"), "octavia-labs/ember");
    assert.equal(cleanGithubTarget("github.com/octavia-labs/ember.git"), "octavia-labs/ember");
    assert.equal(cleanGithubTarget(null), "");
  });
  it("classifies users, repos and invalid input", () => {
    assert.deepEqual(parseGithubTarget("torvalds"), { kind: "user", value: "torvalds" });
    assert.deepEqual(parseGithubTarget("https://github.com/torvalds/linux"), { kind: "repo", value: "torvalds/linux" });
    assert.equal(parseGithubTarget("").kind, "invalid");
    assert.equal(parseGithubTarget("-bad").kind, "invalid", "usernames cannot start with a hyphen");
    assert.equal(parseGithubTarget("a/b/c").kind, "invalid");
    assert.equal(parseGithubTarget("a".repeat(40)).kind, "invalid", "usernames max out at 39 chars");
    assert.equal(parseGithubTarget("<script>alert(1)</script>").kind, "invalid");
  });
});
