/**
 * Integration test harness: real Express routers + real Mongoose models against an in-memory MongoDB.
 *
 *   cd server && npm install && npm run test:integration
 *
 * Safety: this file clears every Redis / Resend / Google variable BEFORE any app module is loaded, so
 * a developer's real .env can never leak into a test run (tests never read .env at all).
 */
for (const key of Object.keys(process.env)) {
  if (/^(UPSTASH_|REDIS_|GEMINI_|RAZORPAY_|GITHUB_TOKEN|GOOGLE_CLIENT_ID|MONGO)/.test(key)) delete process.env[key];
}
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-secret-not-for-production";
process.env.RESEND_API_KEY = "test-key"; // only used to route mail into the in-memory mailbox below
process.env.APP_URL = "https://app.test";

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

// ── Mailbox: capture Resend calls, pass everything else to the real fetch ──
const realFetch = globalThis.fetch;
const mailbox = [];
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith("https://api.resend.com")) {
    mailbox.push(JSON.parse(init.body));
    return { ok: true, status: 200, json: async () => ({}) };
  }
  return realFetch(url, init);
};

async function waitForMail(predicate, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = mailbox.find(predicate);
    if (found) return found;
    await new Promise((r) => setTimeout(r, 20));
  }
  return null;
}

/** The raw one-time token inside an emailed link. */
function tokenFromMail(mail) {
  const m = /token=([A-Za-z0-9_-]+)/.exec(mail.text);
  if (!m) throw new Error(`No token in email: ${mail.text}`);
  return m[1];
}

// ── App lifecycle ──
let mongod = null;
let server = null;

async function startTestApp() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: "gitroast-test" });

  const app = express();
  app.use(express.json());
  app.use("/api/auth", require("../../routes/auth"));
  app.use("/api/recruiter", require("../../routes/recruiter"));
  app.use("/api/roast", require("../../routes/roast"));
  app.use("/api/history", require("../../routes/history"));
  app.use("/api/payment", require("../../routes/payment"));

  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    baseUrl,
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

async function resetDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  mailbox.length = 0;
}

// ── HTTP client: every client gets its own fake IP so the in-memory rate limiter never couples tests ──
let ipCounter = 10;
function createClient(baseUrl, { token = null, ip = null } = {}) {
  const clientIp = ip || `10.1.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;
  async function call(method, path, body, overrideToken) {
    const headers = { "Content-Type": "application/json", "X-Forwarded-For": clientIp };
    const t = overrideToken === undefined ? token : overrideToken;
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }
    return { status: res.status, body: json };
  }
  return {
    ip: clientIp,
    get: (p, t) => call("GET", p, undefined, t),
    post: (p, b, t) => call("POST", p, b, t),
    patch: (p, b, t) => call("PATCH", p, b, t),
    del: (p, b, t) => call("DELETE", p, b, t),
    withToken: (t) => createClient(baseUrl, { token: t, ip: clientIp }),
  };
}

// ── Seed helpers (models are required lazily so env is set first) ──
const models = () => ({
  User: require("../../models/User"),
  Roast: require("../../models/Roast"),
  TalentSave: require("../../models/TalentSave"),
  Shortlist: require("../../models/Shortlist"),
});

async function createRecruiter({ email = "ana@northstar.io", verified = true, password = null } = {}) {
  const { User } = models();
  const { createToken } = require("../../services/tokenService");
  const { hashPassword } = require("../../services/recruiterAuthService");
  const user = await User.create({
    githubId: `recruiter:${new mongoose.Types.ObjectId()}`,
    username: email.split("@")[0],
    email,
    role: "recruiter",
    authProvider: "password",
    passwordHash: password ? hashPassword(password) : undefined,
    emailVerified: verified,
    recruiter: { organization: "Northstar" },
  });
  return { user, token: createToken({ userId: user._id.toString() }) };
}

async function createDeveloper({ username = "dev-one", isPro = false, proPlan = "none", proSince = null } = {}) {
  const { User } = models();
  const { createToken } = require("../../services/tokenService");
  const user = await User.create({ githubId: `gh-${username}`, username, isPro, proPlan, proSince });
  return { user, token: createToken({ userId: user._id.toString() }) };
}

/** Old-looking session: issued `secondsAgo` seconds in the past. */
function tokenIssuedAgo(userId, secondsAgo) {
  return jwt.sign({ userId: String(userId), iat: Math.floor(Date.now() / 1000) - secondsAgo }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function seedRoast({ username, score = 70, grade = "B", language = "TypeScript", isPrivate = false, createdAt = new Date(), snapshot = {}, source = "rules", roastedBy = null, reactions = null } = {}) {
  const { Roast } = models();
  const doc = await Roast.create({
    username,
    score,
    grade,
    roastText: `Roast text for ${username}.`,
    topLanguage: language,
    isPrivate,
    roastSource: source,
    roastedBy,
    githubSnapshot: { totalRepos: 12, abandonedCount: 1, totalStars: 120, hasReadme: true, commitQuality: 80, topLanguage: language, ...snapshot },
    ...(reactions ? { reactions } : {}),
  });
  // Timestamps are managed by Mongoose; set the date directly for window/period tests.
  await Roast.collection.updateOne({ _id: doc._id }, { $set: { createdAt } });
  return doc;
}

module.exports = { startTestApp, resetDb, createClient, mailbox, waitForMail, tokenFromMail, createRecruiter, createDeveloper, tokenIssuedAgo, seedRoast, models };
