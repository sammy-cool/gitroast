'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RoastCard from '@/components/RoastCard'
import ProModal from '@/components/ProModal'
import { getRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'

const MIN_ANALYSIS_TIME = 5800

export default function RoastPageClient({ username }) {
    const [view, setView] = useState('analyzing')
    const [roastData, setRoastData] = useState(null)
    const [showProModal, setShowProModal] = useState(false)
    const router = useRouter()
    // WHY: get token from AuthContext so we can send it with roast request
    //      without this → backend never knows user is Pro
    const { getToken } = useAuth()

    const idempotencyKey = useRef(
        `${username}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    )
    const fetchStarted = useRef(false)

    useEffect(() => {
        if (
            !username ||
            username.length > 39 ||
            !/^[a-zA-Z0-9-]+$/.test(username)
        ) {
            createToast({
                type: 'error',
                textColor: "snow",
                message: 'Invalid GitHub username.',
                position: 'top-center'
            })
            router.push('/')
            return
        }

        // ── Check sessionStorage cache first ─────────────────
        // WHY: handles browser back button — no re-fetch, no duplicate DB save
        const cacheKey = `gitroast_roast_${username}`
        const cachedRoast = sessionStorage.getItem(cacheKey)

        if (cachedRoast) {
            try {
                const parsed = JSON.parse(cachedRoast)
                const cacheAge = Date.now() - parsed.cachedAt
                const TEN_MINS = 10 * 60 * 1000
                if (cacheAge < TEN_MINS) {
                    setRoastData(parsed.data)
                    setView('result')
                    return
                } else {
                    sessionStorage.removeItem(cacheKey)
                }
            } catch {
                sessionStorage.removeItem(cacheKey)
            }
        }

        // ── Block StrictMode double fetch ─────────────────────
        if (fetchStarted.current) return
        fetchStarted.current = true

        let cancelled = false

        async function fetchRoast() {
            try {
                // WHY: get JWT token from localStorage via AuthContext
                //      pass it to getRoast so backend can identify Pro user
                //      optionalAuth middleware reads Authorization header
                //      if header missing → req.user = null → isPro = false → no AI roast
                const token = getToken()

                const [data] = await Promise.all([
                    getRoast(username, idempotencyKey.current, token),
                    new Promise(resolve => setTimeout(resolve, MIN_ANALYSIS_TIME)),
                ])

                if (cancelled) return

                // WHY: cache result so browser back button restores without re-fetching
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    data,
                    cachedAt: Date.now(),
                }))

                setRoastData(data)
                setView('result')

                createToast({
                    type: 'success',
                    textColor: "snow",
                    message: `🔥 @${username}'s roast is ready!`,
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 3500,
                })

            } catch (err) {
                if (cancelled) return

                if (err.code === 'USER_NOT_FOUND') {
                    createToast({
                        type: 'error', message: `GitHub user "@${username}" not found.`,
                        position: 'top-center', duration: 5000, showCloseButton: true,
                        textColor: "snow"
                    })
                    router.push('/')
                    return
                }
                if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    createToast({
                        type: 'warning', message: 'GitHub rate limit hit. Try again in 60 seconds.',
                        position: 'top-center', duration: 6000, showCloseButton: true,
                        textColor: "snow"
                    })
                    router.push('/')
                    return
                }
                if (err.name === 'TimeoutError') {
                    createToast({
                        type: 'error', message: 'Request timed out. Try again.',
                        textColor: "snow", position: 'top-center'
                    })
                    router.push('/')
                    return
                }
                createToast({
                    type: 'error', message: 'Something broke. Not your fault... probably.',
                    position: 'top-center', textColor: "snow",
                })
                router.push('/')
            }
        }

        fetchRoast()
        return () => { cancelled = true }
    }, [username, router, getToken])

    // WHY: clears cache so next roast fetches fresh data
    function handleRoastAnother() {
        const cacheKey = `gitroast_roast_${username}`
        sessionStorage.removeItem(cacheKey)
        router.push('/')
    }

    if (view === 'analyzing') {
        return <AnalyzingScreen username={username} />
    }

    if (view === 'result' && roastData) {
        return (
            <>
                <main className="result-page">

                    <div className="result-nav">
                        <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => router.push(`/history/${roastData.username}`)}
                            >
                                📈 History
                            </button>
                            <button className="btn btn-ghost" onClick={handleRoastAnother}>
                                ← Roast Another
                            </button>
                        </div>
                    </div>

                    <RoastCard
                        data={roastData}
                        onProClick={() => setShowProModal(true)}
                    />

                    {/* Monthly subscription upsell */}
                    <div className="upsell-card card">
                        <div>
                            <p className="upsell-title">📈 Monthly Roast Subscription</p>
                            <p className="upsell-sub font-mono">
                                Track your improvement. Or your shame.
                            </p>
                        </div>
                        <div className="upsell-price">
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
            display:         flex;
            align-items:     baseline;
            gap:             1px;
            justify-content: flex-end;
          }
          .upsell-symbol { font-size: 16px; color: var(--fire); line-height: 1; }
          .upsell-number { font-size: 26px; color: var(--fire); line-height: 1; }
          .upsell-period { font-size: 11px; color: var(--text-secondary); }
        `}</style>
            </>
        )
    }

    return null
}