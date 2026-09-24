// ============================================================
// GITROAST — Client API Gateway & HTTP Service Layer
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Centralized frontend API abstraction communicating with the GitRoast Express backend.
// Manages endpoint routing, dynamic timeout management (extended 60s for Render cold-starts),
// transparent Google reCAPTCHA token injection for unauthenticated guests, idempotency keys,
// Authorization Bearer headers, and standardized error parsing with HTTP 429 Retry-After.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Separation of Concerns: React components remain pure presentation and UI state handlers;
//    they never formulate raw HTTP requests, fetch options, or header definitions directly.
// 2. Centralized Fault Tolerance: Implements resilient timeout thresholds, network recovery,
//    and fail-open CAPTCHA generation without duplicating logic across 12+ pages.
// 3. Deployment Agility: Changing the API root URL or endpoint query parameters happens
//    in a single file (`API_BASE`) rather than across dozens of scattered files.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • Import named service functions (`getRoast`, `getRoastHistory`, `getLeaderboard`,
//   `searchLeaderboard`, `startBattle`, etc.) inside React client components and custom hooks.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Fetching roast results with `X-Idempotency-Key` and `X-Captcha-Token` headers.
// • Paging and searching the Wall of Shame leaderboard.
// • Dispatching contact messages and support tickets.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT invoke browser-only functions (`getCaptchaToken`, `localStorage`) inside Server Components.
// • DO NOT hardcode sensitive API keys or private tokens inside this client-facing file.
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── getCaptchaToken ───────────────────────────────────────────
// WHAT: Obtains Google reCAPTCHA v3 token for bot defense
// WHY: Only executes for unauthenticated users when site key is present
//      Fails open gracefully if blocked by adblockers or network issues
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

// ── getRoast ──────────────────────────────────────────────────
// WHAT: Fetches a roast for a GitHub username
// WHY attach retryAfter to error:
//   Server sends { retryAfter: 47 } on rate limit (429)
//   Frontend can show "Try again in 47 seconds" — not hardcoded "60s"
export async function getRoast(
  username,
  idempotencyKey = null,
  token = null,
  intensity = "savage",
) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("roast");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const url = `${API_BASE}/api/roast/${encodeURIComponent(username)}?intensity=${encodeURIComponent(intensity)}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
    // WHY 60s timeout: accommodates Render free tier cold start (40-50s)
    signal: AbortSignal.timeout(60000),
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch roast");
    err.code = json.error;
    err.status = res.status;
    // WHY: attach retryAfter so frontend can show exact countdown
    //      server sends this on 429 — was being ignored before
    err.retryAfter = json.retryAfter || null;
    throw err;
  }

  return json.data;
}

// ── getRoastHistory ───────────────────────────────────────────
export async function getRoastHistory(username) {
  const res = await fetch(`${API_BASE}/api/history/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch history");
  return json;
}

// ── trackShare ────────────────────────────────────────────────
// WHY silent: share tracking failure must never affect UX
export async function trackShare(roastId) {
  if (!roastId) return;
  try {
    await fetch(`${API_BASE}/api/history/${roastId}/share`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    /* silent */
  }
}

// ── trackView ─────────────────────────────────────────────────
// WHAT: Silently records an anonymous roast view
export async function trackView(roastId) {
  if (!roastId) return;
  try {
    await fetch(`${API_BASE}/api/history/${roastId}/view`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* silent */
  }
}

// ── trackBattleShare ──────────────────────────────────────────
// WHAT: Silently records a battle share event
export async function trackBattleShare(battleId) {
  if (!battleId) return;
  try {
    await fetch(`${API_BASE}/api/battle/${battleId}/share`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* silent */
  }
}

// ── trackBattleView ───────────────────────────────────────────
// WHAT: Silently records a battle view event
export async function trackBattleView(battleId) {
  if (!battleId) return;
  try {
    await fetch(`${API_BASE}/api/battle/${battleId}/view`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* silent */
  }
}

// ── checkHealth ───────────────────────────────────────────────
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

// ── wakeUpServer ──────────────────────────────────────────────
// WHAT: Silently pre-warms the Render backend if sleeping on free tier
// WHY: Render spins down after 15 min of inactivity. Pinging /health
//      on page load starts the container before user submits a form.
export function wakeUpServer() {
  if (typeof window === "undefined") return;
  fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(60000) }).catch(() => {});
}

// ── getBattleRoast ────────────────────────────────────────────
// WHY attach retryAfter here too:
//   Battle route also has rate limiting — same pattern
export async function getBattleRoast(user1, user2, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("battle");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const res = await fetch(
    `${API_BASE}/api/battle/${encodeURIComponent(user1)}/vs/${encodeURIComponent(user2)}`,
    { method: "GET", headers, signal: AbortSignal.timeout(60000) },
  );

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message || "Battle failed");
    err.code = json.error;
    err.status = res.status;
    err.retryAfter = json.retryAfter || null;
    throw err;
  }

  return json.data;
}

// ── reactToRoast ──────────────────────────────────────────────
// WHAT: Sends a reaction (relatable/destroyed/savage) to a roast
// WHY silent on error: reaction failure must never break UX
//     same pattern as trackShare
// WHY returns data: component updates counts from response
//     avoids separate fetch after reacting
export async function reactToRoast(roastId, type) {
  try {
    const res = await fetch(`${API_BASE}/api/history/${roastId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    return json;
  } catch {
    // WHY: silently fail — reaction is non-critical
    return null;
  }
}

// ── reactToBattle ─────────────────────────────────────────────
// WHAT: Sends an emoji reaction (relatable/destroyed/savage) to a battle
// WHY: Persists battle reactions in MongoDB and updates social proof counts
export async function reactToBattle(battleId, type) {
  try {
    const res = await fetch(`${API_BASE}/api/battle/${battleId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    return json;
  } catch {
    // WHY: silently fail — reaction is non-critical for UX continuity
    return null;
  }
}

// ── getWrapped ────────────────────────────────────────────────
// WHAT: Fetches GitHub Wrapped year-in-review roast
export async function getWrapped(username, year = 2025, token = null) {
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

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch GitHub Wrapped");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json.wrapped;
}

// ── getLeaderboard ────────────────────────────────────────────
// WHAT: Fetches paginated Wall of Shame leaderboard
export async function getLeaderboard(page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/history/leaderboard/worst?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch leaderboard");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json;
}

// ── searchLeaderboard ──────────────────────────────────────────
// WHAT: Searches the Wall of Shame by username prefix/substring
export async function searchLeaderboard(query, page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/history/leaderboard/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || "Search failed");
    err.code = json.error;
    throw err;
  }
  return json;
}

// ── getRoastFeed ──────────────────────────────────────────────
// WHAT: Fetches last 10 public roasts for live feed on homepage
export async function getRoastFeed() {
  try {
    const res = await fetch(`${API_BASE}/api/roast/feed`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.feed) ? json.feed : [];
  } catch {
    return [];
  }
}

// ── getRoastStats ─────────────────────────────────────────────
// WHAT: Fetches total number of roasts generated
export async function getRoastStats() {
  try {
    const res = await fetch(`${API_BASE}/api/roast/stats`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.success && typeof json.totalRoasts === "number" ? json.totalRoasts : 0;
  } catch {
    return 0;
  }
}

// ── getCompanyLeaderboard ─────────────────────────────────────
// WHAT: Fetches curated tech giant rankings and chaos scores
export async function getCompanyLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/api/history/leaderboard/companies`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.companies) ? json.companies : [];
  } catch {
    return [];
  }
}

// ── getRoastOfTheDay ──────────────────────────────────────────
// WHAT: Fetches top-reacted burn for homepage feature
export async function getRoastOfTheDay() {
  try {
    const res = await fetch(`${API_BASE}/api/history/daily-burn`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.roast ? json.roast : null;
  } catch {
    return null;
  }
}

// ── getRepoRoast ──────────────────────────────────────────────
// WHAT: Fetches repository-level deep roast (Pillar 3)
export async function getRepoRoast(
  owner,
  repo,
  token = null,
  intensity = "savage",
) {
  const headers = { "Content-Type": "application/json" };

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

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch repository roast");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

// ── dispatchContactMessage ────────────────────────────────────
// WHAT: Dispatches a user contact inquiry or bug report to the server
export async function dispatchContactMessage({
  category,
  name,
  email,
  message,
}) {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, name, email, message }),
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error || "Failed to dispatch message");
    err.code = json.code;
    err.status = res.status;
    throw err;
  }

  return json;
}

// ── streamRoast ───────────────────────────────────────────────
// ── WHAT: ─────────────────────────────────────────────────────
// Asynchronous client stream consumer that connects to the Server-Sent Events (SSE)
// endpoint (`/api/roast/:username/stream`). Reads chunked network byte streams via
// Fetch `ReadableStream` and `TextDecoder`, dynamically executing callbacks for
// initial metadata (profile stats, avatar), incremental text chunks, and final payload.
//
// ── WHY: ──────────────────────────────────────────────────────
// Traditional REST roast generation blocks for 3 to 6 seconds while Gemini AI synthesizes
// the roast, forcing the user to endure a static spinner. SSE streaming delivers initial
// metadata immediately and streams tokens in real-time as Gemini produces them, dropping
// TTFB (Time to First Token) to < 500ms and enabling a live typewriter effect.
//
// ── WHERE & WHEN TO USE: ──────────────────────────────────────
// • In `RoastPageClient` or preview modals when the user requests an interactive,
//   progressive roast generation experience.
// • When immediate feedback and low perceived latency are critical for user retention.
//
// ── USE CASES: ────────────────────────────────────────────────
// • Real-time typewriter output of AI roast lines as they are generated by Gemini.
// • Progressive rendering of GitHub profile metrics while the roast text streams in.
//
// ── WHEN NOT TO USE: ──────────────────────────────────────────
// • DO NOT use in Server Components or static build routines (`getStaticProps`, `generateStaticParams`).
// • DO NOT use if the browser environment lacks `ReadableStream` or `TextDecoder` support (ancient browsers).
// • DO NOT use for batch operations or automated keep-alive cron jobs.
// ──────────────────────────────────────────────────────────────
export async function streamRoast(
  username,
  intensity = "savage",
  token = null,
  callbacks = {},
) {
  const { onMetadata, onChunk, onDone, onError } = callbacks;
  const headers = { Accept: "text/event-stream" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const captchaToken = await getCaptchaToken("roast");
    if (captchaToken) headers["X-Captcha-Token"] = captchaToken;
  }

  const url = `${API_BASE}/api/roast/${encodeURIComponent(username)}/stream?intensity=${encodeURIComponent(intensity)}`;

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
          // Ignore JSON parse errors for non-JSON or heartbeat chunks
        }
      }
    }
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

