'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RoastCard from '@/components/RoastCard'
import ProModal from '@/components/ProModal'
import { getRoast } from '@/services/roastService'

// WHY 5800ms: matches last ANALYSIS_STEPS delay (4900ms)
//     + 900ms buffer so animation always completes fully
const MIN_ANALYSIS_TIME = 5800

export default function RoastPageClient({ username }) {
    const [view, setView] = useState('analyzing')
    const [roastData, setRoastData] = useState(null)
    const [showProModal, setShowProModal] = useState(false)
    const router = useRouter()

    // WHY idempotencyKey useRef:
    //   - generates ONCE per component mount
    //   - StrictMode: mount → unmount → remount = SAME ref = SAME key
    //     → server sees same key → returns cache → no duplicate save
    //   - "Roast Again" click → router.push('/') → NEW mount
    //     → NEW ref → NEW key → server processes fresh → saves new roast
    const idempotencyKey = useRef(
        `${username}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    )

    // WHY fetchStarted useRef:
    //   - extra guard specifically for StrictMode
    //   - first mount: fetchStarted = false → runs fetch → sets true
    //   - StrictMode second mount: fetchStarted = true → exits immediately
    //   - never reaches network on second mount = cleanest possible fix
    const fetchStarted = useRef(false)

    useEffect(() => {
        // ── Validate username ────────────────────────────────
        if (
            !username ||
            username.length > 39 ||
            !/^[a-zA-Z0-9-]+$/.test(username)
        ) {
            createToast({
                type: 'error',
                message: 'Invalid GitHub username.',
                position: 'top-center',
            })
            router.push('/')
            return
        }

        // ── Check sessionStorage cache FIRST ─────────────────
        // WHY: handles browser back button scenario
        //
        // Full scenario without this fix:
        //   /roast/torvalds → loads, saves roast to DB
        //   User clicks "History" → goes to /history/torvalds
        //   User presses browser BACK
        //   → /roast/torvalds mounts again
        //   → useEffect fires again
        //   → NEW fetch → NEW DB save → duplicate roast in history
        //
        // With this fix:
        //   First visit → fetch → save to DB → cache in sessionStorage
        //   Browser back → mount → finds cache → restores instantly
        //   → NO fetch → NO DB save → history stays clean
        const cacheKey = `gitroast_roast_${username}`
        const cachedRoast = sessionStorage.getItem(cacheKey)

        if (cachedRoast) {
            try {
                const parsed = JSON.parse(cachedRoast)
                const cacheAge = Date.now() - parsed.cachedAt
                const TEN_MINS = 10 * 60 * 1000

                if (cacheAge < TEN_MINS) {
                    // WHY: cache is fresh — restore without any fetch
                    //      user sees result instantly, no API call, no DB write
                    setRoastData(parsed.data)
                    setView('result')
                    return  // ← EXIT here, never fetch
                } else {
                    // WHY: cache too old — remove and fetch fresh data
                    sessionStorage.removeItem(cacheKey)
                }
            } catch {
                // WHY: corrupted JSON in cache — remove and fetch fresh
                sessionStorage.removeItem(cacheKey)
            }
        }

        // ── Block StrictMode second mount ────────────────────
        if (fetchStarted.current) return
        fetchStarted.current = true

        let cancelled = false

        async function fetchRoast() {
            try {
                // WHY Promise.all with timer:
                //   API call and minimum display time run in PARALLEL
                //   card never flashes in before animation ends
                const [data] = await Promise.all([
                    getRoast(username, idempotencyKey.current),
                    new Promise(resolve => setTimeout(resolve, MIN_ANALYSIS_TIME)),
                ])

                if (cancelled) return

                // WHY: cache immediately after successful fetch
                //      so browser back button restores this result
                //      without re-fetching or creating duplicate DB entry
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
                        message: `GitHub user "@${username}" not found. Check the spelling.`,
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
                        message: 'Request timed out. GitHub might be slow — try again.',
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

    // ── Intentional "Roast Another" handler ──────────────────
    // WHY separate function — NOT just router.push('/'):
    //   router.push('/') alone would go to landing
    //   but if user types same username again
    //   cache would still exist → shows old result → no new roast
    //
    //   By clearing cache here:
    //   → next visit to /roast/[username] = fresh fetch = new roast saved
    //   This is the ONLY place we want to clear cache intentionally
    function handleRoastAnother() {
        const cacheKey = `gitroast_roast_${username}`
        sessionStorage.removeItem(cacheKey)
        router.push('/')
    }

    // ── Views ─────────────────────────────────────────────────
    if (view === 'analyzing') {
        return <AnalyzingScreen username={username} />
    }

    if (view === 'result' && roastData) {
        return (
            <>
                <main className="result-page">

                    {/* Top nav */}
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
                            {/* WHY handleRoastAnother not router.push:
                  clears cache so next roast is always fresh */}
                            <button
                                className="btn btn-ghost"
                                onClick={handleRoastAnother}
                            >
                                ← Roast Another
                            </button>
                        </div>
                    </div>

                    {/* Roast card */}
                    <RoastCard
                        data={roastData}
                        onProClick={() => setShowProModal(true)}
                    />

                    {/* Monthly subscription upsell — INR pricing */}
                    <div className="upsell-card card">
                        <div>
                            <p className="upsell-title">📈 Monthly Roast Subscription</p>
                            <p className="upsell-sub font-mono">
                                Track your improvement. Or your shame.
                            </p>
                        </div>
                        <div className="upsell-price">
                            {/* WHY: ₹ symbol smaller, number bigger */}
                            <div className="upsell-amount-row">
                                <span className="font-display upsell-symbol">₹</span>
                                <span className="font-display upsell-number">499</span>
                            </div>
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
          .nav-logo { font-size: 22px; }
          .upsell-card {
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
          .upsell-amount-row {
            display:     flex;
            align-items: baseline;
            gap:         1px;
            justify-content: flex-end;
          }
          /* WHY: ₹ symbol smaller than number */
          .upsell-symbol { font-size: 16px; color: var(--fire); line-height: 1; }
          .upsell-number { font-size: 26px; color: var(--fire); line-height: 1; }
          .upsell-period { font-size: 11px; color: var(--text-secondary); }
        `}</style>
            </>
        )
    }

    return null
}