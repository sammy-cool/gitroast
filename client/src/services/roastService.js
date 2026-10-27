import { defaultWrappedYear } from "../utils/wrapped.js";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function safeParseJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || `HTTP ${res.status} ${res.statusText}`, error: "GATEWAY_ERROR" };
  }
}

async function getCaptchaToken(action = "roast") {
  if (typeof window === "undefined") return null;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || !window.grecaptcha) return null;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 3000);
    try {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });
          clearTimeout(timer);
          resolve(token);
        } catch {
          clearTimeout(timer);
          resolve(null);
        }
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

export async function getRoast(
  username,
  idempotencyKey = null,
  token = null,
  intensity = "crispy",
  persona = "staff_engineer",
) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("roast");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const url = `${API_BASE}/api/roast/${encodeURIComponent(username)}?intensity=${encodeURIComponent(intensity)}&persona=${encodeURIComponent(persona)}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(60000),
  });

  const json = await safeParseJson(res);

  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch roast");
    err.code = json.error;
    err.status = res.status;
    err.retryAfter = json.retryAfter || null;
    err.resetsAt = json.resetsAt || null;
    throw err;
  }

  return json.data;
}

export async function getRoastHistory(username) {
  const res = await fetch(`${API_BASE}/api/history/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  const json = await safeParseJson(res);
  if (!res.ok) throw new Error(json.message || "Failed to fetch history");
  return json;
}

export async function trackShare(roastId) {
  if (!roastId) return;
  try {
    await fetch(`${API_BASE}/api/history/${roastId}/share`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
  }
}

export async function trackView(roastId) {
  if (!roastId) return;
  try {
    await fetch(`${API_BASE}/api/history/${roastId}/view`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
  }
}

export async function trackBattleShare(battleId) {
  if (!battleId) return;
  try {
    await fetch(`${API_BASE}/api/battle/${battleId}/share`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
  }
}

export async function trackBattleView(battleId) {
  if (!battleId) return;
  try {
    await fetch(`${API_BASE}/api/battle/${battleId}/view`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
  }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function wakeUpServer() {
  if (typeof window === "undefined") return;
  fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(60000) }).catch(() => {});
}

export async function getBattleRoast(user1, user2, token = null, rematch = false) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("battle");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const queryParams = rematch ? "?rematch=true" : "";
  const res = await fetch(
    `${API_BASE}/api/battle/${encodeURIComponent(user1)}/vs/${encodeURIComponent(user2)}${queryParams}`,
    { method: "GET", headers, signal: AbortSignal.timeout(60000) },
  );

  const json = await safeParseJson(res);

  if (!res.ok) {
    const err = new Error(json.message || "Battle failed");
    err.code = json.error;
    err.status = res.status;
    err.retryAfter = json.retryAfter || null;
    err.resetsAt = json.resetsAt || null;
    throw err;
  }

  return json.data;
}

export async function reactToRoast(roastId, type) {
  try {
    const res = await fetch(`${API_BASE}/api/history/${roastId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await safeParseJson(res);
    return json;
  } catch {
    return null;
  }
}

export async function reactToBattle(battleId, type) {
  try {
    const res = await fetch(`${API_BASE}/api/battle/${battleId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await safeParseJson(res);
    return json;
  } catch {
    return null;
  }
}

export async function getWrapped(username, year = defaultWrappedYear(), token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("wrapped");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const res = await fetch(
    `${API_BASE}/api/roast/${encodeURIComponent(username)}/wrapped?year=${year}`,
    { method: "GET", headers, signal: AbortSignal.timeout(60000) },
  );

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch GitHub Wrapped");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json.wrapped;
}

export async function getLeaderboard(page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/history/leaderboard/worst?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    },
  );

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch leaderboard");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json;
}

export async function searchLeaderboard(query, page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/history/leaderboard/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    },
  );
  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Search failed");
    err.code = json.error;
    throw err;
  }
  return json;
}

export async function getRoastFeed() {
  try {
    const res = await fetch(`${API_BASE}/api/roast/feed`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await safeParseJson(res);
    return json.success && Array.isArray(json.feed) ? json.feed : [];
  } catch {
    return [];
  }
}

export async function getRoastStats() {
  try {
    const res = await fetch(`${API_BASE}/api/roast/stats`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return 0;
    const json = await safeParseJson(res);
    return json.success && typeof json.totalRoasts === "number" ? json.totalRoasts : 0;
  } catch {
    return 0;
  }
}

export async function getCompanyLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/api/history/leaderboard/companies`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await safeParseJson(res);
    return json.success && Array.isArray(json.companies) ? json.companies : [];
  } catch {
    return [];
  }
}

export async function getRoastOfTheDay() {
  try {
    const res = await fetch(`${API_BASE}/api/history/daily-burn`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await safeParseJson(res);
    return json.success && json.roast ? json.roast : null;
  } catch {
    return null;
  }
}

export async function getRepoRoast(
  owner,
  repo,
  token = null,
  intensity = "crispy",
  idempotencyKey = null,
) {
  const headers = { "Content-Type": "application/json" };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("roast");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const url = `${API_BASE}/api/roast/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?intensity=${encodeURIComponent(intensity)}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(60000),
  });

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch repository roast");
    err.code = json.error;
    err.status = res.status;
    err.retryAfter = json.retryAfter || null;
    err.resetsAt = json.resetsAt || null;
    throw err;
  }
  return json.data;
}

export async function dispatchContactMessage({
  category,
  name,
  email,
  message,
}) {
  const headers = { "Content-Type": "application/json" };
  const captchaToken = await getCaptchaToken("contact");
  if (captchaToken) headers["X-Captcha-Token"] = captchaToken;

  const res = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers,
    body: JSON.stringify({ category, name, email, message }),
    signal: AbortSignal.timeout(15000),
  });

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.error || "Failed to dispatch message");
    err.code = json.code;
    err.status = res.status;
    throw err;
  }

  return json;
}

export async function streamRoast(
  username,
  intensity = "crispy",
  token = null,
  callbacks = {},
  persona = "staff_engineer",
) {
  const { onMetadata, onChunk, onDone, onError } = callbacks;
  const headers = { Accept: "text/event-stream" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("roast");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const url = `${API_BASE}/api/roast/${encodeURIComponent(username)}/stream?intensity=${encodeURIComponent(intensity)}&persona=${encodeURIComponent(persona)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const err = new Error(errJson.message || `SSE stream failed with status ${res.status}`);
      err.status = res.status;
      err.code = errJson.error;
      throw err;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("ReadableStream not supported by response body");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          let eventType = "message";
          let dataStr = "";

          const lines = trimmed.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace(/^event:\s*/, "").trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.replace(/^data:\s*/, "").trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === "metadata" && onMetadata) {
              onMetadata(parsed);
            } else if (eventType === "chunk" && onChunk) {
              onChunk(parsed.chunk || parsed.text || "");
            } else if (eventType === "done" && onDone) {
              onDone(parsed.roast || parsed);
            } else if (eventType === "error") {
              const streamErr = new Error(parsed.message || "Streaming error");
              if (onError) onError(streamErr);
              throw streamErr;
            }
          } catch {
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

export const getBattle = getBattleRoast;
export const getDailyBurn = getRoastOfTheDay;

export async function getRateLimitStatus(token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/roast/rate-limit-status`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(10000),
  });

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch rate limit status");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json;
}

export async function updateUserPreferences(preferences, token) {
  if (!token) throw new Error("Authentication required to update preferences.");

  const res = await fetch(`${API_BASE}/api/auth/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
    signal: AbortSignal.timeout(10000),
  });

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to update preferences");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json;
}

export async function getUniverse(username, token = null) {
  const cleanUsername = (username || "").trim().toLowerCase();
  if (!cleanUsername) throw new Error("Username is required.");

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("universe").catch(() => null);
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const res = await fetch(`${API_BASE}/api/roast/${encodeURIComponent(cleanUsername)}/universe`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(60000),
  });

  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to generate 3D Code Solar System.");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json;
}


// ── Regional pricing ────────────────────────────────────────────
export async function detectCountry() {
  try {
    const cached = sessionStorage.getItem("gitroast_country");
    if (cached) return cached;
    const res = await fetch("/api/geo", { signal: AbortSignal.timeout(4000) });
    const { country } = await res.json();
    sessionStorage.setItem("gitroast_country", country);
    return country;
  } catch {
    return "US";
  }
}

export async function getPlans(country) {
  const c = country || (await detectCountry());
  const res = await fetch(`${API_BASE}/api/payment/plans?country=${encodeURIComponent(c)}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("Could not load plans");
  const json = await res.json();
  return { country: json.country, currency: json.currency, plans: json.plans || [] };
}

export function formatPrice(amountMinor, currency) {
  if (!amountMinor) return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(0);
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
}

// ── Wall of Shame: evidence board ──────────────────────────────
export async function getEvidenceBoard({ page = 1, limit = 10, weeks = 12, language = "", q = "" } = {}) {
  const p = new URLSearchParams({ page: String(page), limit: String(limit), weeks: String(weeks) });
  if (language) p.set("language", language);
  if (q) p.set("q", q);
  const res = await fetch(`${API_BASE}/api/history/leaderboard/board?${p}`, { signal: AbortSignal.timeout(15000) });
  const json = await safeParseJson(res);
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch the evidence board");
    err.status = res.status;
    throw err;
  }
  return json;
}
