const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const PASSWORD = "correct-horse-battery";
const signupBody = (email = "ana@northstar.io") => ({ email, password: PASSWORD, acceptResponsibleUse: true });

describe("recruiter account lifecycle (integration)", () => {
  let ctx;
  before(async () => {
    ctx = await h.startTestApp();
  });
  after(async () => {
    await ctx.stop();
  });
  beforeEach(async () => {
    await h.resetDb();
  });

  async function signup(email = "ana@northstar.io") {
    const api = h.createClient(ctx.baseUrl);
    const res = await api.post("/api/auth/recruiter/signup", signupBody(email));
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { api, token: res.body.token, user: res.body.user };
  }

  it("signup creates an unverified account and emails a verification link", async () => {
    const { user, token } = await signup();
    assert.equal(user.role, "recruiter");
    assert.equal(user.emailVerified, false);
    assert.ok(token);
    const mail = await h.waitForMail((m) => m.to.includes("ana@northstar.io"));
    assert.ok(mail, "verification email was sent");
    assert.match(mail.subject, /Verify/);
    assert.match(mail.text, /https:\/\/app\.test\/auth\/verify\?token=/);
  });

  it("validates signup input", async () => {
    const api = h.createClient(ctx.baseUrl);
    assert.equal((await api.post("/api/auth/recruiter/signup", { email: "ana@northstar.io", password: "short", acceptResponsibleUse: true })).status, 400);
    assert.equal((await api.post("/api/auth/recruiter/signup", { email: "not-an-email", password: PASSWORD, acceptResponsibleUse: true })).status, 400);
    const noConsent = await api.post("/api/auth/recruiter/signup", { email: "ana@northstar.io", password: PASSWORD });
    assert.equal(noConsent.status, 400);
    assert.equal(noConsent.body.error, "CONSENT_REQUIRED");
    assert.equal((await api.post("/api/auth/recruiter/signup", signupBody())).status, 201);
    const dup = await api.post("/api/auth/recruiter/signup", signupBody());
    assert.equal(dup.status, 409);
  });

  it("blocks the workspace until the email is verified, but keeps the methodology public", async () => {
    const { api, token } = await signup();
    const blocked = await api.get("/api/recruiter/saved", token);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error, "EMAIL_NOT_VERIFIED");
    assert.equal((await api.get("/api/recruiter/methodology", token)).status, 200);
  });

  it("verifies with the emailed token exactly once and stores only a hash", async () => {
    const { api, token } = await signup();
    const mail = await h.waitForMail((m) => m.to.includes("ana@northstar.io"));
    const raw = h.tokenFromMail(mail);

    const { User } = h.models();
    const stored = await User.findOne({ email: "ana@northstar.io" }).select("+emailVerification.tokenHash");
    assert.equal(stored.emailVerification.tokenHash.length, 64);
    assert.notEqual(stored.emailVerification.tokenHash, raw, "the raw token is never stored");

    assert.equal((await api.post("/api/auth/recruiter/verify", { token: "x".repeat(43) })).status, 400, "unknown token");
    assert.equal((await api.post("/api/auth/recruiter/verify", { token: { $ne: "" } })).status, 400, "operator injection is rejected");
    const ok = await api.post("/api/auth/recruiter/verify", { token: raw });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.verified, true);
    assert.equal((await api.get("/api/recruiter/saved", token)).status, 200, "workspace opens after verification");
    assert.equal((await api.post("/api/auth/recruiter/verify", { token: raw })).status, 400, "links are single-use");
  });

  it("rejects an expired verification link", async () => {
    const { api } = await signup();
    const mail = await h.waitForMail((m) => m.to.includes("ana@northstar.io"));
    const raw = h.tokenFromMail(mail);
    const { User } = h.models();
    await User.updateOne({ email: "ana@northstar.io" }, { $set: { "emailVerification.expiresAt": new Date(Date.now() - 1000) } });
    assert.equal((await api.post("/api/auth/recruiter/verify", { token: raw })).status, 400);
  });

  it("resend is rate limited per account, and a new link replaces the old one", async () => {
    const { api, token } = await signup();
    const first = await h.waitForMail((m) => m.to.includes("ana@northstar.io"));
    const oldRaw = h.tokenFromMail(first);

    const tooSoon = await api.post("/api/auth/recruiter/verify/resend", {}, token);
    assert.equal(tooSoon.status, 429);
    assert.equal(tooSoon.body.error, "COOLDOWN");

    const { User } = h.models();
    await User.updateOne({ email: "ana@northstar.io" }, { $set: { "emailVerification.sentAt": new Date(Date.now() - 120_000) } });
    h.mailbox.length = 0;
    const resent = await api.post("/api/auth/recruiter/verify/resend", {}, token);
    assert.equal(resent.status, 200);
    const second = await h.waitForMail((m) => m.to.includes("ana@northstar.io"));
    const newRaw = h.tokenFromMail(second);
    assert.notEqual(newRaw, oldRaw);
    assert.equal((await api.post("/api/auth/recruiter/verify", { token: oldRaw })).status, 400, "old link no longer works");
    assert.equal((await api.post("/api/auth/recruiter/verify", { token: newRaw })).status, 200);
  });

  it("forgot-password never reveals whether an account exists", async () => {
    await signup();
    h.mailbox.length = 0;
    const api = h.createClient(ctx.baseUrl);
    const unknown = await api.post("/api/auth/recruiter/forgot", { email: "nobody@nowhere.io" });
    const known = await api.post("/api/auth/recruiter/forgot", { email: "ANA@northstar.io" });
    assert.equal(unknown.status, 200);
    assert.equal(known.status, 200);
    assert.deepEqual(unknown.body, known.body, "identical responses");
    const mail = await h.waitForMail((m) => /Reset/.test(m.subject));
    assert.ok(mail, "an email exists for the real account");
    assert.equal(h.mailbox.filter((m) => /Reset/.test(m.subject)).length, 1, "none for the unknown address");
    // a second request inside the cooldown does not send another email
    await api.post("/api/auth/recruiter/forgot", { email: "ana@northstar.io" });
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(h.mailbox.filter((m) => /Reset/.test(m.subject)).length, 1);
  });

  it("password reset: single-use link, new password works, old password and old sessions stop", async () => {
    const { api, user } = await signup();
    h.mailbox.length = 0;
    await api.post("/api/auth/recruiter/forgot", { email: "ana@northstar.io" });
    const mail = await h.waitForMail((m) => /Reset/.test(m.subject));
    const raw = h.tokenFromMail(mail);
    const oldSession = h.tokenIssuedAgo(user.id, 300);
    assert.equal((await api.get("/api/auth/me", oldSession)).status, 200, "old session works before the reset");

    assert.equal((await api.post("/api/auth/recruiter/reset", { token: raw, password: "short" })).status, 400, "password policy applies");
    const NEW = "an-entirely-new-passphrase";
    const done = await api.post("/api/auth/recruiter/reset", { token: raw, password: NEW });
    assert.equal(done.status, 200);

    assert.equal((await api.post("/api/auth/recruiter/reset", { token: raw, password: NEW })).status, 400, "link is single-use");
    assert.equal((await api.get("/api/auth/me", oldSession)).status, 401, "sessions issued before the reset are rejected");
    assert.equal((await api.post("/api/auth/recruiter/login", { email: "ana@northstar.io", password: PASSWORD })).status, 401, "old password fails");
    const login = await api.post("/api/auth/recruiter/login", { email: "ana@northstar.io", password: NEW });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.emailVerified, true, "controlling the mailbox verifies the address");
    assert.equal((await api.get("/api/auth/me", login.body.token)).status, 200, "a fresh session works");
  });

  it("rejects an expired reset link", async () => {
    const { api } = await signup();
    h.mailbox.length = 0;
    await api.post("/api/auth/recruiter/forgot", { email: "ana@northstar.io" });
    const raw = h.tokenFromMail(await h.waitForMail((m) => /Reset/.test(m.subject)));
    const { User } = h.models();
    await User.updateOne({ email: "ana@northstar.io" }, { $set: { "passwordReset.expiresAt": new Date(Date.now() - 1000) } });
    assert.equal((await api.post("/api/auth/recruiter/reset", { token: raw, password: "an-entirely-new-passphrase" })).status, 400);
  });

  it("deleting the account needs DELETE and the password, and removes the recruiter's data only", async () => {
    const { api, token, user } = await signup();
    const other = await h.createRecruiter({ email: "bo@other.io" });
    const { TalentSave, Shortlist, User } = h.models();
    await TalentSave.create({ recruiterId: user.id, username: "someone" });
    await Shortlist.create({ recruiterId: user.id, name: "Mine", members: ["someone"] });
    await TalentSave.create({ recruiterId: other.user._id, username: "kept" });
    await Shortlist.create({ recruiterId: other.user._id, name: "Theirs" });

    assert.equal((await api.del("/api/auth/recruiter/account", { password: PASSWORD }, token)).status, 400, "needs the DELETE confirmation");
    assert.equal((await api.del("/api/auth/recruiter/account", { confirm: "DELETE", password: "wrong-password-here" }, token)).status, 401);
    assert.equal(await User.countDocuments({ email: "ana@northstar.io" }), 1, "nothing deleted by failed attempts");

    const gone = await api.del("/api/auth/recruiter/account", { confirm: "DELETE", password: PASSWORD }, token);
    assert.equal(gone.status, 200);
    assert.equal(await User.countDocuments({ email: "ana@northstar.io" }), 0);
    assert.equal(await TalentSave.countDocuments({ recruiterId: user.id }), 0);
    assert.equal(await Shortlist.countDocuments({ recruiterId: user.id }), 0);
    assert.equal(await TalentSave.countDocuments({ recruiterId: other.user._id }), 1, "other recruiters are untouched");
    assert.equal(await Shortlist.countDocuments({ recruiterId: other.user._id }), 1);
    assert.equal((await api.get("/api/auth/me", token)).status, 401, "the deleted account's session no longer works");
  });

  it("the auth endpoints are rate limited per client IP", async () => {
    const api = h.createClient(ctx.baseUrl, { ip: "10.99.99.99" });
    let last;
    for (let i = 0; i < 26; i++) last = await api.post("/api/auth/recruiter/login", { email: "ana@northstar.io", password: "wrong-password-here" });
    assert.equal(last.status, 429);
  });

  it("Google sign-in reports a clear error when it is not configured", async () => {
    const api = h.createClient(ctx.baseUrl);
    const res = await api.post("/api/auth/recruiter/google", { credential: "anything" });
    assert.equal(res.status, 503);
  });
});
