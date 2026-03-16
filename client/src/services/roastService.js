// WHY: reads from .env.local — never hardcode URLs
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─── getRoast ─────────────────────────────────────────────
// WHY: main function — fetches full roast for a username
export async function getRoast(username) {
    const res = await fetch(`${API_BASE}/api/roast/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // WHY: 15s timeout — GitHub API can be slow
        signal: AbortSignal.timeout(15000),
    })

    const json = await res.json()

    // WHY: throw with error code so caller can show right message
    if (!res.ok) {
        const err = new Error(json.message || 'Failed to fetch roast')
        err.code = json.error  // USER_NOT_FOUND, RATE_LIMIT_EXCEEDED, etc.
        err.status = res.status
        throw err
    }

    return json.data
}

// ─── checkHealth ──────────────────────────────────────────
// WHY: quick ping to verify backend is up before fetching
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

// ─── getRoastHistory ──────────────────────────────────────
// WHY: fetch past roasts for a username
//      used on result page to show improvement over time
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
// WHY: call this when user clicks Share
//      increments share count in MongoDB for analytics
export async function trackShare(roastId) {
    if (!roastId) return   // WHY: silently skip if no ID

    try {
        await fetch(`${API_BASE}/api/history/${roastId}/share`, {
            method: 'POST',
            signal: AbortSignal.timeout(5000),
        })
    } catch {
        // WHY: tracking failure must never affect UX
    }
}