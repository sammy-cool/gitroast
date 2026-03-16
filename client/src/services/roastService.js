// WHY: reads from .env.local — never hardcode URLs
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── getRoast ─────────────────────────────────────────────
// WHY: main function — fetches full roast for a username
export async function getRoast(username, idempotencyKey = null) {
    const headers = {
        'Content-Type': 'application/json',
    }

    // WHY: attach key so server can deduplicate StrictMode calls
    //      same key = cached response returned, no DB save
    if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey
    }

    const res = await fetch(`${API_BASE}/api/roast/${username}`, {
        method: 'GET',
        headers,
        // WHY 15s timeout: GitHub API can be slow
        signal: AbortSignal.timeout(15000),
    })

    const json = await res.json()

    // WHY: throw with error code so caller shows right message
    if (!res.ok) {
        const err = new Error(json.message || 'Failed to fetch roast')
        err.code = json.error
        err.status = res.status
        throw err
    }

    return json.data
}

// ─── getRoastHistory ──────────────────────────────────────
// WHY: fetch past roasts for a username
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
// WHY: increments share count in MongoDB for analytics
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
// WHY: quick ping to verify backend is up
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