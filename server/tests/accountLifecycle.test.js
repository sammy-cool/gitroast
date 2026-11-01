const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const tokens = require("../services/accountTokens");
const mail = require("../services/transactionalEmail");

describe("account tokens", () => {
  it("generates unguessable, single-purpose tokens and stores only a hash", () => {
    const now = Date.UTC(2026, 9, 28, 12, 0, 0);
    const a = tokens.generateToken(tokens.RESET_TTL_MS, now);
    const b = tokens.generateToken(tokens.RESET_TTL_MS, now);
    assert.notEqual(a.token, b.token);
    assert.equal(a.tokenHash, tokens.hashToken(a.token));
    assert.notEqual(a.tokenHash, a.token, "the hash is not the token");
    assert.equal(a.tokenHash.length, 64);
    assert.equal(a.expiresAt.getTime(), now + 60 * 60 * 1000);
    assert.ok(tokens.isWellFormedToken(a.token));
  });

  it("rejects malformed tokens before any database lookup", () => {
    for (const bad of [undefined, null, 42, "", "short", "a".repeat(39), "a".repeat(65), "has space " + "a".repeat(40), { $ne: "x" }, ["a".repeat(43)]]) {
      assert.equal(tokens.isWellFormedToken(bad), false, `rejects ${JSON.stringify(bad)}`);
    }
  });

  it("handles expiry and resend cooldowns", () => {
    const now = Date.UTC(2026, 9, 28, 12, 0, 0);
    assert.equal(tokens.isExpired(new Date(now + 1000), now), false);
    assert.equal(tokens.isExpired(new Date(now), now), true, "expires at the boundary");
    assert.equal(tokens.isExpired(null, now), true, "missing expiry counts as expired");
    assert.equal(tokens.cooldownRemaining(null, now), 0);
    assert.equal(tokens.cooldownRemaining(new Date(now - 10_000), now), 50);
    assert.equal(tokens.cooldownRemaining(new Date(now - 61_000), now), 0);
  });

  it("invalidates sessions issued before a password change only", () => {
    const changedAt = new Date("2026-10-28T12:00:00Z");
    const before = Math.floor(changedAt.getTime() / 1000) - 60;
    const after = Math.floor(changedAt.getTime() / 1000) + 60;
    assert.equal(tokens.sessionPredatesPasswordChange({ passwordChangedAt: changedAt }, { iat: before }), true);
    assert.equal(tokens.sessionPredatesPasswordChange({ passwordChangedAt: changedAt }, { iat: after }), false);
    assert.equal(tokens.sessionPredatesPasswordChange({ passwordChangedAt: null }, { iat: before }), false, "no change recorded");
    assert.equal(tokens.sessionPredatesPasswordChange({ passwordChangedAt: changedAt }, {}), false, "no iat claim");
  });
});

describe("transactional email", () => {
  it("picks a public base URL for links", () => {
    assert.equal(mail.appBaseUrl({ APP_URL: "https://gitroast.dev/" }), "https://gitroast.dev");
    assert.equal(mail.appBaseUrl({ CLIENT_URL: "http://localhost:3000,https://gitroast.dev,https://www.gitroast.dev" }), "https://gitroast.dev");
    assert.equal(mail.appBaseUrl({ CLIENT_URL: "http://localhost:3000" }), "http://localhost:3000");
    assert.equal(mail.appBaseUrl({}), "http://localhost:3000");
  });

  it("builds branded emails and escapes the link in HTML", () => {
    const evil = 'https://x.test/auth/reset?token=abc"><script>alert(1)</script>';
    const e = mail.resetEmail({ link: evil });
    assert.ok(!e.html.includes("<script>"), "no raw script tag");
    assert.ok(e.html.includes("&lt;script&gt;"));
    assert.match(e.subject, /Reset your GitRoast password/);
    assert.match(e.text, /expires in 1 hour/);
    const v = mail.verificationEmail({ link: "https://gitroast.dev/auth/verify?token=t" });
    assert.match(v.subject, /Verify/);
    assert.match(v.text, /24 hours/);
  });

  it("never logs links in production when no provider is configured", async () => {
    const logs = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(" "));
    try {
      const r = await mail.sendEmail({ to: "a@b.co", subject: "s", text: "SECRET-LINK", html: "<p>x</p>" }, { env: { NODE_ENV: "production" } });
      assert.equal(r.delivered, false);
    } finally {
      console.log = orig;
    }
    assert.ok(!logs.some((l) => l.includes("SECRET-LINK")), "link must not be printed in production");
  });

  it("prints the link in development so flows can be tested", async () => {
    const logs = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(" "));
    try {
      await mail.sendEmail({ to: "a@b.co", subject: "s", text: "DEV-LINK", html: "<p>x</p>" }, { env: { NODE_ENV: "development" } });
    } finally {
      console.log = orig;
    }
    assert.ok(logs.some((l) => l.includes("DEV-LINK")));
  });

  it("sends through the provider and reports failures without throwing", async () => {
    let seen;
    const ok = await mail.sendEmail(
      { to: "r@co.io", subject: "S", text: "t", html: "<p>h</p>" },
      { env: { RESEND_API_KEY: "k", EMAIL_FROM: "GitRoast <hi@gitroast.dev>" }, fetchImpl: async (url, init) => { seen = { url, init }; return { ok: true, status: 200 }; } },
    );
    assert.equal(ok.delivered, true);
    assert.equal(seen.url, "https://api.resend.com/emails");
    const body = JSON.parse(seen.init.body);
    assert.deepEqual(body.to, ["r@co.io"]);
    assert.equal(body.from, "GitRoast <hi@gitroast.dev>");
    assert.equal(seen.init.headers.Authorization, "Bearer k");

    const rejected = await mail.sendEmail({ to: "a@b.co", subject: "s", text: "t", html: "h" }, { env: { RESEND_API_KEY: "k" }, fetchImpl: async () => ({ ok: false, status: 403 }) });
    assert.deepEqual(rejected, { delivered: false, reason: "provider-403" });
    const down = await mail.sendEmail({ to: "a@b.co", subject: "s", text: "t", html: "h" }, { env: { RESEND_API_KEY: "k" }, fetchImpl: async () => { throw new Error("boom"); } });
    assert.deepEqual(down, { delivered: false, reason: "network" });
  });
});
