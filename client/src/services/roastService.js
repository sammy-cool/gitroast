const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── getRoast ─────────────────────────────────────────────
// WHY intensity param: passes user's selected intensity to backend
//     backend uses it to tune AI prompt and rule engine
export async function getRoast(
  username,
  idempotencyKey = null,
  token = null,
  intensity = "savage",
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  // WHY intensity as query param not header:
  //     it's user preference data, not request metadata
  //     query params are simpler to read on backend
  //     easier to log and debug
  const url = `${API_BASE}/api/roast/${username}?intensity=${encodeURIComponent(intensity)}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message || "Failed to fetch roast");
    err.code = json.error;
    err.status = res.status;
    throw err;
  }

  return json.data;
}

// ─── getRoastHistory ──────────────────────────────────────
export async function getRoastHistory(username) {
  const res = await fetch(`${API_BASE}/api/history/${username}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch history");
  return json;
}

// ─── trackShare ───────────────────────────────────────────
export async function trackShare(roastId) {
  if (!roastId) return;
  try {
    await fetch(`${API_BASE}/api/history/${roastId}/share`, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // WHY: tracking failure must never affect UX
  }
}

// ─── checkHealth ──────────────────────────────────────────
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
