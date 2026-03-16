const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── main function — fetches full roast for a username ────────────────────
export async function getRoast(username, idempotencyKey = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    }

    // WHY: attach auth token so backend can identify Pro user
    //      optionalAuth middleware reads this header
    //      if missing → req.user = null → isPro always false
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // WHY: attach idempotency key to block StrictMode duplicates
    if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey
    }

    const res = await fetch(`${API_BASE}/api/roast/${username}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15000),
    })

    const json = await res.json()

    if (!res.ok) {
        const err = new Error(json.message || 'Failed to fetch roast')
        err.code = json.error
        err.status = res.status
        throw err
    }

    return json.data
}

// ─── getRoastHistory ──────────────────────────────────────
export async function getRoastHistory(username) {
    const res = await fetch(`${API_BASE}/api/history/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Failed to fetch history')
    return json
}

// ─── trackShare ───────────────────────────────────────────
export async function trackShare(roastId) {
    if (!roastId) return
    try {
        await fetch(`${API_BASE}/api/history/${roastId}/share`, {
            method: 'POST',
            signal: AbortSignal.timeout(5000),
        })
    } catch {
        // WHY: tracking failure must never affect UX
    }
}

// ─── checkHealth ──────────────────────────────────────────
export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`, {
            signal: AbortSignal.timeout(5000),
        })
        return res.ok
    } catch {
        return false
    }
}