/**
 * Regional pricing. Amounts are in minor units (cents / paise).
 * Launch prices: Free $0, Pro Roaster $5, Historian $9 (override via PRICING_OVERRIDES_JSON).
 * Server is authoritative: create-order recomputes price from country,
 * the client only displays what /api/payment/plans returned.
 */
const EU = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "));

// Default prices in minor units (cents / paise). Launch defaults: USD $5 / $9.
const DEFAULT_PRICES = {
  USD: { roaster: 500, historian: 900 },
  EUR: { roaster: 500, historian: 900 },
  GBP: { roaster: 400, historian: 700 },
  INR: { roaster: 9900, historian: 19900 }, // regional pricing, unchanged for existing Indian customers
};

// Change prices WITHOUT a code change: set PRICING_OVERRIDES_JSON on the server, e.g.
//   {"USD":{"roaster":500,"historian":900},"INR":{"roaster":7900}}
// Only valid positive integers are accepted; anything else is ignored (defaults stay).
function loadPrices(raw = process.env.PRICING_OVERRIDES_JSON) {
  const table = JSON.parse(JSON.stringify(DEFAULT_PRICES));
  if (!raw) return table;
  try {
    const o = JSON.parse(raw);
    for (const [cur, plans] of Object.entries(o || {})) {
      if (!table[cur] || typeof plans !== "object") continue;
      for (const [plan, amount] of Object.entries(plans)) {
        if (table[cur][plan] !== undefined && Number.isInteger(amount) && amount > 0) table[cur][plan] = amount;
      }
    }
  } catch {
    /* invalid JSON → keep defaults */
  }
  return table;
}
const PRICE_TABLE = loadPrices();

const PLAN_META = {
  roaster: {
    id: "roaster",
    name: "Pro Roaster",
    badge: "Most roasted",
    tagline: "30 AI roasts / month",
    features: ["History", "Personas", "Badges", "Ghost Mode"],
  },
  historian: {
    id: "historian",
    name: "Historian",
    badge: null,
    tagline: "Unlimited history + 200 AI roasts",
    features: ["Trend exports", "Comparison", "Priority analysis"],
  },
};

function currencyForCountry(country) {
  const c = String(country || "").toUpperCase();
  if (c === "IN") return "INR";
  if (c === "GB") return "GBP";
  if (EU.has(c)) return "EUR";
  return "USD";
}

function resolveCountry(req) {
  const raw =
    req?.query?.country ||
    req?.body?.country ||
    req.headers?.["x-vercel-ip-country"] ||
    req.headers?.["cf-ipcountry"] ||
    "";
  const c = String(raw).toUpperCase().trim();
  return /^[A-Z]{2}$/.test(c) ? c : "US";
}

function getPlan(planId, country) {
  const meta = PLAN_META[planId];
  if (!meta) return null;
  const currency = currencyForCountry(country);
  return { ...meta, currency, amount: PRICE_TABLE[currency][planId], country };
}

function listPlans(country) {
  const currency = currencyForCountry(country);
  return {
    country,
    currency,
    plans: [
      { id: "free", name: "Free", amount: 0, currency, tagline: "3 AI roasts / month", features: ["Public result", "Share card", "Community"] },
      ...Object.keys(PLAN_META).map((id) => getPlan(id, country)),
    ],
  };
}

module.exports = { DEFAULT_PRICES, loadPrices, PRICE_TABLE, PLAN_META, currencyForCountry, resolveCountry, getPlan, listPlans };
