/**
 * AI-roast entitlement quota (separate from the abuse guard).
 *
 *  - Abuse guard  : per-IP / per-user daily limits in middleware/rateLimiter + User.canRoastToday (unchanged).
 *  - Entitlement  : how many *AI* roasts a plan includes per period (this file).
 *    Free  → 3 / calendar month (UTC)          Pro Roaster → 30 / billing cycle
 *    Historian → 200 / billing cycle ("fair use"; shown as unlimited history)
 *  When the AI allowance is used up the roast gracefully falls back to the rules engine
 *  (never a hard block), and the response tells the client when it resets.
 *
 * Change limits without a deploy: QUOTA_OVERRIDES_JSON='{"free":3,"roaster":30,"historian":200}'
 * (positive integers; null = unlimited).
 */
const DEFAULT_LIMITS = { free: 3, roaster: 30, historian: 200 };

function loadLimits(raw = process.env.QUOTA_OVERRIDES_JSON) {
  const limits = { ...DEFAULT_LIMITS };
  if (!raw) return limits;
  try {
    const o = JSON.parse(raw);
    for (const [plan, v] of Object.entries(o || {})) {
      if (!(plan in limits)) continue;
      if (v === null || (Number.isInteger(v) && v > 0)) limits[plan] = v;
    }
  } catch {
    /* invalid JSON → defaults */
  }
  return limits;
}

function planOf(user) {
  if (!user || !user.isPro) return "free";
  return user.proPlan && user.proPlan !== "none" ? user.proPlan : "roaster";
}

function addMonthsUTC(date, months) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(date.getUTCDate(), lastDay)); // Jan 31 + 1 month → Feb 28/29
  return d;
}

/** Current quota window. Free: calendar month (UTC). Paid: monthly cycles anchored at proSince. */
function periodFor(plan, user, now = new Date()) {
  const anchor = plan !== "free" && user?.proSince ? new Date(user.proSince) : null;
  if (!anchor || Number.isNaN(anchor.getTime()) || anchor > now) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { start, resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) };
  }
  let n = (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());
  let start = addMonthsUTC(anchor, n);
  if (start > now) {
    n -= 1;
    start = addMonthsUTC(anchor, n);
  }
  return { start, resetsAt: addMonthsUTC(anchor, n + 1) };
}

function buildQuota({ plan, limit, used, period }) {
  const unlimited = limit === null;
  return {
    plan,
    limit,
    used,
    remaining: unlimited ? null : Math.max(0, limit - used),
    unlimited,
    exhausted: !unlimited && used >= limit,
    periodStart: period.start.toISOString(),
    resetsAt: period.resetsAt.toISOString(),
  };
}

/** Quota for a signed-in user, or null for anonymous visitors (rules engine only). */
async function getAiQuota(user, { now = new Date(), limits = loadLimits() } = {}) {
  if (!user) return null;
  const plan = planOf(user);
  const period = periodFor(plan, user, now);
  const limit = limits[plan];
  const Roast = require("../models/Roast"); // lazy: keeps the pure helpers testable without a DB driver
  const used = await Roast.countDocuments({ roastedBy: user._id, roastSource: "ai", createdAt: { $gte: period.start } });
  return buildQuota({ plan, limit, used, period });
}

const canUseAi = (quota) => Boolean(quota) && !quota.exhausted;

/** Quota snapshot after one more AI roast was consumed (for the response, no extra DB hit). */
function afterConsuming(quota) {
  if (!quota) return null;
  return buildQuota({
    plan: quota.plan,
    limit: quota.limit,
    used: quota.used + 1,
    period: { start: new Date(quota.periodStart), resetsAt: new Date(quota.resetsAt) },
  });
}

module.exports = { DEFAULT_LIMITS, loadLimits, planOf, periodFor, buildQuota, getAiQuota, canUseAi, afterConsuming };
