const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

describe("public discovery respects Ghost Mode (integration)", () => {
  let ctx;
  let api;
  before(async () => {
    ctx = await h.startTestApp();
  });
  after(async () => {
    await ctx.stop();
  });
  beforeEach(async () => {
    await h.resetDb();
    api = h.createClient(ctx.baseUrl);
  });

  it("the live feed never lists hidden profiles", async () => {
    await h.seedRoast({ username: "public-person" });
    await h.seedRoast({ username: "ghost-person", isPrivate: true });
    const res = await api.get("/api/roast/feed");
    assert.equal(res.status, 200);
    const users = res.body.feed.map((f) => f.username);
    assert.ok(users.includes("public-person"));
    assert.ok(!users.includes("ghost-person"), "Ghost Mode profile leaked into the feed");
  });

  it("roast of the day never picks a hidden profile, even with the most reactions", async () => {
    await h.seedRoast({ username: "public-person", reactions: { relatable: 0, destroyed: 0, savage: 1 } });
    await h.seedRoast({ username: "ghost-person", isPrivate: true, reactions: { relatable: 0, destroyed: 500, savage: 999 } });
    const res = await api.get("/api/history/daily-burn");
    assert.equal(res.status, 200);
    assert.equal(res.body.roast.username, "public-person");
  });

  it("roast of the day falls back to the placeholder when only hidden profiles exist", async () => {
    await h.seedRoast({ username: "ghost-person", isPrivate: true, reactions: { relatable: 0, destroyed: 0, savage: 999 } });
    const res = await api.get("/api/history/daily-burn");
    assert.equal(res.status, 200);
    assert.notEqual(res.body.roast.username, "ghost-person");
  });

  it("the Wall of Shame evidence board excludes hidden profiles and ranks best first", async () => {
    await h.seedRoast({ username: "high", score: 92 });
    await h.seedRoast({ username: "mid", score: 70 });
    await h.seedRoast({ username: "ghost-person", score: 99, isPrivate: true });
    const res = await api.get("/api/history/leaderboard/board?weeks=12&limit=10");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.entries.map((e) => e.username), ["high", "mid"]);
    assert.equal(res.body.pagination.total, 2);
    assert.equal(res.body.entries[0].rank, 1);
    assert.ok(typeof res.body.entries[0].nickname === "string" && res.body.entries[0].nickname.length > 0);
  });
});

describe("regional pricing endpoint (integration)", () => {
  let ctx;
  before(async () => {
    ctx = await h.startTestApp();
  });
  after(async () => {
    await ctx.stop();
  });

  const plans = async (query = "", headers = {}) => {
    const res = await fetch(`${ctx.baseUrl}/api/payment/plans${query}`, { headers });
    return { status: res.status, body: await res.json() };
  };
  const amount = (body, id) => body.plans.find((p) => p.id === id).amount;

  it("prices by country, computed on the server", async () => {
    const india = await plans("?country=IN");
    assert.equal(india.body.currency, "INR");
    assert.equal(amount(india.body, "roaster"), 9900);
    assert.equal(amount(india.body, "historian"), 19900);

    const us = await plans("?country=US");
    assert.equal(us.body.currency, "USD");
    assert.equal(amount(us.body, "roaster"), 500);
    assert.equal(amount(us.body, "historian"), 900);
    assert.equal(amount(us.body, "free"), 0);

    assert.equal((await plans("?country=DE")).body.currency, "EUR");
    assert.equal((await plans("?country=GB")).body.currency, "GBP");
  });

  it("falls back safely on bad input and honours the edge country header", async () => {
    assert.equal((await plans("?country=zz%24%24")).body.currency, "USD", "malformed country falls back to US");
    assert.equal((await plans("", { "x-vercel-ip-country": "IN" })).body.currency, "INR");
    assert.equal((await plans("?country=US", { "x-vercel-ip-country": "IN" })).body.currency, "USD", "explicit query wins over the header");
  });
});

describe("AI-roast quota against real data (integration)", () => {
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

  const quota = () => require("../../services/quota");

  it("free plan: counts AI roasts in the current calendar month only", async () => {
    const { user } = await h.createDeveloper({ username: "freebie" });
    const now = new Date("2026-10-24T12:00:00Z");
    const seed = (createdAt, source) => h.seedRoast({ username: "freebie", roastedBy: user._id, source, createdAt });
    await seed(new Date("2026-10-02T09:00:00Z"), "ai");
    await seed(new Date("2026-10-20T09:00:00Z"), "ai");
    await seed(new Date("2026-10-21T09:00:00Z"), "rules"); // rules-engine roasts never count
    await seed(new Date("2026-09-28T09:00:00Z"), "ai"); // last month does not count

    let q = await quota().getAiQuota(user, { now });
    assert.equal(q.plan, "free");
    assert.equal(q.limit, 3);
    assert.equal(q.used, 2);
    assert.equal(q.remaining, 1);
    assert.equal(q.exhausted, false);
    assert.equal(q.resetsAt, "2026-11-01T00:00:00.000Z");
    assert.ok(quota().canUseAi(q));

    await seed(new Date("2026-10-23T09:00:00Z"), "ai");
    q = await quota().getAiQuota(user, { now });
    assert.equal(q.used, 3);
    assert.equal(q.exhausted, true);
    assert.ok(!quota().canUseAi(q), "exhausted quota falls back to the rules engine");
  });

  it("paid plan: counts inside the billing cycle that started on the subscription day", async () => {
    const { user } = await h.createDeveloper({ username: "payer", isPro: true, proPlan: "roaster", proSince: new Date("2026-08-18T10:00:00Z") });
    const now = new Date("2026-10-24T12:00:00Z");
    await h.seedRoast({ username: "payer", roastedBy: user._id, source: "ai", createdAt: new Date("2026-10-10T09:00:00Z") }); // previous cycle
    await h.seedRoast({ username: "payer", roastedBy: user._id, source: "ai", createdAt: new Date("2026-10-20T09:00:00Z") });

    const q = await quota().getAiQuota(user, { now });
    assert.equal(q.plan, "roaster");
    assert.equal(q.limit, 30);
    assert.equal(q.used, 1);
    assert.equal(q.remaining, 29);
    assert.equal(q.periodStart, "2026-10-18T10:00:00.000Z");
    assert.equal(q.resetsAt, "2026-11-18T10:00:00.000Z");
  });

  it("anonymous visitors have no AI allowance", async () => {
    assert.equal(await quota().getAiQuota(null), null);
    assert.equal(quota().canUseAi(null), false);
  });
});
