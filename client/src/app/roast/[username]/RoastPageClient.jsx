'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RoastCard from '@/components/RoastCard'
import ProModal from '@/components/ProModal'
import { getRoast } from '@/services/roastService'

const MIN_ANALYSIS_TIME = 5800

export default function RoastPageClient({ username }) {
    const [view, setView] = useState('analyzing')
    const [roastData, setRoastData] = useState(null)
    const [showProModal, setShowProModal] = useState(false)
    const router = useRouter()

    // WHY useRef for key: persists across re-renders
    //     but generates fresh on every NEW mount
    //     StrictMode second mount = same ref = same key
    const idempotencyKey = useRef(
        `${username}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    )

    // WHY useRef for fetchStarted:
    //     blocks StrictMode second mount from fetching at all
    //     first mount sets it true → second mount exits immediately
    const fetchStarted = useRef(false)

    useEffect(() => {
        // ── Validate username ──────────────────────────────
        if (!username || username.length > 39 ||
            !/^[a-zA-Z0-9-]+$/.test(username)) {
            createToast({
                type: 'error',
                message: 'Invalid GitHub username.',
                position: 'top-center',
            })
            router.push('/')
            return
        }

        // ── Check sessionStorage FIRST ─────────────────────
        // WHY: if user pressed browser back button
        //      we already have the result — no need to re-fetch
        //      no new API call, no new DB save, instant display
        const cacheKey = `gitroast_roast_${username}`
        const cachedRoast = sessionStorage.getItem(cacheKey)

        if (cachedRoast) {
            try {
                const parsed = JSON.parse(cachedRoast)

                // WHY: check cache age — don't show stale data
                //      older than 10 minutes = fetch fresh
                const cacheAge = Date.now() - parsed.cachedAt
                const TEN_MINS = 10 * 60 * 1000

                if (cacheAge < TEN_MINS) {
                    // WHY: restore from cache — no fetch, no DB save
                    //      user sees result instantly
                    setRoastData(parsed.data)
                    setView('result')
                    return  // ← exit here, never fetch
                } else {
                    // WHY: cache too old → remove it → fetch fresh
                    sessionStorage.removeItem(cacheKey)
                }
            } catch {
                // WHY: corrupted cache → remove and fetch fresh
                sessionStorage.removeItem(cacheKey)
            }
        }

        // ── Block StrictMode double fetch ──────────────────
        // WHY: fetchStarted ref persists within same mount cycle
        //      StrictMode: mount → unmount → remount = same ref
        //      Second attempt sees fetchStarted = true → exits
        if (fetchStarted.current) return
        fetchStarted.current = true

        let cancelled = false

        async function fetchRoast() {
            try {
                const [data] = await Promise.all([
                    getRoast(username, idempotencyKey.current),
                    new Promise(resolve => setTimeout(resolve, MIN_ANALYSIS_TIME)),
                ])

                if (cancelled) return

                // WHY: save to sessionStorage IMMEDIATELY after fetch
                //      so browser back button restores this result
                //      without triggering a new fetch or DB save
                const cacheKey = `gitroast_roast_${username}`
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    data,
                    cachedAt: Date.now(),
                }))

                setRoastData(data)
                setView('result')

                createToast({
                    type: 'success',
                    message: `🔥 @${username}'s roast is ready!`,
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 3500,
                })

            } catch (err) {
                if (cancelled) return

                if (err.code === 'USER_NOT_FOUND') {
                    createToast({
                        type: 'error',
                        message: `GitHub user "@${username}" not found.`,
                        position: 'top-center',
                        duration: 5000,
                        showCloseButton: true,
                    })
                    router.push('/')
                    return
                }

                if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    createToast({
                        type: 'warning',
                        message: 'GitHub rate limit hit. Try again in 60 seconds.',
                        position: 'top-center',
                        duration: 6000,
                        showCloseButton: true,
                    })
                    router.push('/')
                    return
                }

                if (err.name === 'TimeoutError') {
                    createToast({
                        type: 'error',
                        message: 'Request timed out. Try again.',
                        position: 'top-center',
                    })
                    router.push('/')
                    return
                }

                createToast({
                    type: 'error',
                    message: 'Something broke. Not your fault... probably.',
                    position: 'top-center',
                })
                router.push('/')
            }
        }

        fetchRoast()

        return () => { cancelled = true }
    }, [username, router])

    // ── "Roast Again" — intentional re-roast ──────────────
    // WHY: this function is called ONLY when user deliberately
    //      clicks "Roast Again" — not on back navigation
    //      clears cache so next mount fetches fresh data
    function handleRoastAgain() {
        // WHY: remove cache so fresh roast is fetched + saved
        const cacheKey = `gitroast_roast_${username}`
        sessionStorage.removeItem(cacheKey)
        // WHY: navigate away and back = fresh mount = fresh fetch
        router.push('/')
    }

    // ── Views ─────────────────────────────────────────────
    if (view === 'analyzing') {
        return <AnalyzingScreen username={username} />
    }

    if (view === 'result' && roastData) {
        return (
            <>
                <main className="result-page">
                    <div className="result-nav">
                        <div className="font-display nav-logo text-fire">
                            GITROAST 🔥
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => router.push(`/history/${roastData.username}`)}
                            >
                                📈 History
                            </button>
                            {/* WHY: use handleRoastAgain not router.push
                  so cache is cleared = fresh roast intended */}
                            <button
                                className="btn btn-ghost"
                                onClick={handleRoastAgain}
                            >
                                ← Roast Another
                            </button>
                        </div>
                    </div>

                    <RoastCard
                        data={roastData}
                        onProClick={() => setShowProModal(true)}
                    />

                    <div className="upsell-card card">
                        <div>
                            <p className="upsell-title">
                                📈 Monthly Roast Subscription
                            </p>
                            <p className="upsell-sub font-mono">
                                Track your improvement. Or your shame.
                            </p>
                        </div>
                        <div className="upsell-price">
                            <span className="font-display upsell-amount">$4.99</span>
                            <span className="font-mono upsell-period">/month</span>
                        </div>
                    </div>
                </main>

                {showProModal && (
                    <ProModal onClose={() => setShowProModal(false)} />
                )}

                <style jsx>{`
          .result-page {
            min-height:     100vh;
            display:        flex;
            flex-direction: column;
            align-items:    center;
            padding:        1.5rem 1rem 3rem;
            gap:            1.25rem;
          }
          .result-nav {
            display:         flex;
            justify-content: space-between;
            align-items:     center;
            width:           100%;
            max-width:       580px;
          }
          .nav-logo      { font-size: 22px; }
          .upsell-card   {
            width:           100%;
            max-width:       580px;
            padding:         1rem 1.5rem;
            display:         flex;
            justify-content: space-between;
            align-items:     center;
            gap:             1rem;
          }
          .upsell-title  { font-size: 14px; font-weight: 500; margin: 0 0 4px; }
          .upsell-sub    { color: var(--text-secondary); font-size: 12px; }
          .upsell-price  { text-align: right; flex-shrink: 0; }
          .upsell-amount { font-size: 26px; color: var(--fire); }
          .upsell-period { font-size: 11px; color: var(--text-secondary); }
        `}</style>
            </>
        )
    }

    return null
}