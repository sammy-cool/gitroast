const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const monthsAgo = (n) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
};

describe("recruiter workspace API (integration)", () => {
  let ctx;
  let api; // verified recruiter
  before(async () => {
    ctx = await h.startTestApp();
  });
  after(async () => {
    await ctx.stop();
  });
  beforeEach(async () => {
    await h.resetDb();
    const { token } = await h.createRecruiter();
    api = h.createClient(ctx.baseUrl, { token });
  });

  const names = (res) => res.body.results.map((r) => r.username);

  it("requires a recruiter session", async () => {
    const anon = h.createClient(ctx.baseUrl);
    assert.equal((await anon.get("/api/recruiter/talent")).status, 401);
    const dev = await h.createDeveloper();
    const res = await anon.get("/api/recruiter/talent", dev.token);
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "RECRUITER_REQUIRED");
  });

  it("lists only public profiles, one row per person, best fit first", async () => {
    await h.seedRoast({ username: "strong-dev", snapshot: { totalRepos: 20, abandonedCount: 0, totalStars: 5000, commitQuality: 95 } });
    await h.seedRoast({ username: "weak-dev", snapshot: { totalRepos: 3, abandonedCount: 3, totalStars: 0, commitQuality: 20, hasReadme: false } });
    await h.seedRoast({ username: "ghost-dev", isPrivate: true, snapshot: { totalRepos: 30, totalStars: 99999, commitQuality: 100 } });
    // an older roast of the same person must not create a second row
    await h.seedRoast({ username: "strong-dev", createdAt: monthsAgo(3), snapshot: { totalRepos: 1, totalStars: 0, commitQuality: 10 } });

    const res = await api.get("/api/recruiter/talent");
    assert.equal(res.status, 200);
    assert.deepEqual(names(res), ["strong-dev", "weak-dev"], "ghost excluded, deduplicated, ranked by fit");
    assert.ok(res.body.results[0].fit.score > res.body.results[1].fit.score);
    assert.equal(res.body.summary.evidenceProfiles, 2);
    assert.equal(res.body.role.id, "senior-ic");
    assert.ok(res.body.role.weights.depth > 0, "role weights are returned for Explain ranking");
  });

  it("applies the evidence window", async () => {
    await h.seedRoast({ username: "fresh", createdAt: monthsAgo(1) });
    await h.seedRoast({ username: "stale", createdAt: monthsAgo(30) });
    assert.deepEqual(names(await api.get("/api/recruiter/talent?window=12")), ["fresh"]);
    assert.deepEqual(names(await api.get("/api/recruiter/talent?window=24")), ["fresh"]);
    assert.deepEqual(names(await api.get("/api/recruiter/talent")).sort(), ["fresh", "stale"], "no window means any time");
    assert.deepEqual(names(await api.get("/api/recruiter/talent?window=banana")).sort(), ["fresh", "stale"], "invalid window is ignored");
  });

  it("filters by search text and language", async () => {
    await h.seedRoast({ username: "rust-guru", language: "Rust" });
    await h.seedRoast({ username: "ts-wizard", language: "TypeScript" });
    assert.deepEqual(names(await api.get("/api/recruiter/talent?q=guru")), ["rust-guru"]);
    assert.deepEqual(names(await api.get("/api/recruiter/talent?language=typescript")), ["ts-wizard"]);
    assert.deepEqual(names(await api.get("/api/recruiter/talent?q=.*")), [], "regex input is treated as text");
  });

  it("candidate profile: public only, exact match, with score trend", async () => {
    await h.seedRoast({ username: "pat", score: 60, createdAt: monthsAgo(4) });
    await h.seedRoast({ username: "pat", score: 72, createdAt: monthsAgo(2) });
    await h.seedRoast({ username: "pat", score: 99, createdAt: monthsAgo(1), isPrivate: true });
    await h.seedRoast({ username: "pat-2", score: 50 });

    const res = await api.get("/api/recruiter/talent/pat");
    assert.equal(res.status, 200);
    assert.equal(res.body.candidate.username, "pat", "exact username, not the prefix match pat-2");
    assert.deepEqual(res.body.trend.map((t) => t.score), [60, 72], "private roasts never appear in the trend");
    assert.ok(res.body.disclaimer);

    await h.seedRoast({ username: "hidden-one", isPrivate: true });
    assert.equal((await api.get("/api/recruiter/talent/hidden-one")).status, 404);
    assert.equal((await api.get("/api/recruiter/talent/not-analyzed")).status, 404);
    assert.equal((await api.get("/api/recruiter/talent/bad%20name!")).status, 400);
  });

  it("save and unsave are idempotent and reflected in search", async () => {
    await h.seedRoast({ username: "kai" });
    assert.equal((await api.post("/api/recruiter/saved/kai", {})).status, 200);
    assert.equal((await api.post("/api/recruiter/saved/kai", {})).status, 200, "saving twice is fine");
    const saved = await api.get("/api/recruiter/saved");
    assert.deepEqual(saved.body.saved.map((s) => s.username), ["kai"]);
    assert.equal((await api.get("/api/recruiter/talent")).body.results[0].saved, true);
    assert.equal((await api.del("/api/recruiter/saved/kai")).status, 200);
    assert.equal((await api.get("/api/recruiter/saved")).body.saved.length, 0);
    assert.equal((await api.post("/api/recruiter/saved/bad%20name!", {})).status, 400);
  });

  it("shortlists: create, add, remove, delete, and isolation between recruiters", async () => {
    const created = await api.post("/api/recruiter/shortlists", { name: "Senior systems IC", members: ["Aria", "aria", "octavia", "bad name!"] });
    assert.equal(created.status, 201);
    const id = created.body.shortlist.id;
    assert.deepEqual(created.body.shortlist.members, ["aria", "octavia"], "lowercased, deduplicated, invalid dropped");

    assert.equal((await api.post("/api/recruiter/shortlists", { name: "  " })).status, 400);

    const patched = await api.patch(`/api/recruiter/shortlists/${id}`, { add: ["nora"], remove: ["octavia"], name: "Renamed" });
    assert.equal(patched.status, 200);
    assert.deepEqual(patched.body.shortlist.members.sort(), ["aria", "nora"]);
    assert.equal(patched.body.shortlist.name, "Renamed");
    assert.equal((await api.patch("/api/recruiter/shortlists/not-an-id", { name: "x" })).status, 400);

    // another recruiter cannot see or change it
    const other = h.createClient(ctx.baseUrl, { token: (await h.createRecruiter({ email: "bo@other.io" })).token });
    assert.equal((await other.get("/api/recruiter/shortlists")).body.shortlists.length, 0);
    assert.equal((await other.patch(`/api/recruiter/shortlists/${id}`, { name: "Hijack" })).status, 404);
    await other.del(`/api/recruiter/shortlists/${id}`);
    assert.equal((await api.get("/api/recruiter/shortlists")).body.shortlists.length, 1, "foreign delete is a no-op");

    assert.equal((await api.del(`/api/recruiter/shortlists/${id}`)).status, 200);
    assert.equal((await api.get("/api/recruiter/shortlists")).body.shortlists.length, 0);
  });

  it("compare needs two public profiles", async () => {
    await h.seedRoast({ username: "ada" });
    await h.seedRoast({ username: "bea" });
    await h.seedRoast({ username: "cyd", isPrivate: true });
    assert.equal((await api.get("/api/recruiter/compare?u=ada")).status, 400);
    const two = await api.get("/api/recruiter/compare?u=ada,bea");
    assert.equal(two.status, 200);
    assert.equal(two.body.candidates.length, 2);
    const withPrivate = await api.get("/api/recruiter/compare?u=ada,bea,cyd");
    assert.deepEqual(withPrivate.body.candidates.map((c) => c.username).sort(), ["ada", "bea"], "private profiles are not compared");
  });
});
