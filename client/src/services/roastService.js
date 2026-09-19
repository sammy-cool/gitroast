// ============================================================
// GITROAST — Roast Service
// ============================================================
// WHAT: All API calls to the backend from the frontend.
//       Single file for all fetch logic — components never
//       call fetch directly.
//
// WHY centralized service:
//   Error handling in one place — not duplicated per component
//   Easy to add auth headers, timeouts, retryAfter everywhere
//   If API base URL changes → change one constant
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  if (token) headers["Authorization"] = `Bearer ${token}`;
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
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

// ── getWrapped ────────────────────────────────────────────────
// WHAT: Fetches GitHub Wrapped year-in-review roast
export async function getWrapped(username, year = 2025, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

