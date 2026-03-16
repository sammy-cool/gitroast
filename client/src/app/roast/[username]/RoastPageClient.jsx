'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RoastCard from '@/components/RoastCard'
import ProModal from '@/components/ProModal'
import { getRoast, checkHealth } from '@/services/roastService'

// WHY: minimum time to show analyzing screen
//      even if API responds faster — UX feels more substantial
const MIN_ANALYSIS_TIME = 5800

export default function RoastPageClient({ username }) {
    const [view, setView] = useState('analyzing')
    const [roastData, setRoastData] = useState(null)
    const [showProModal, setShowProModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // WHY: validate before hitting API
        if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
            createToast({
                type: 'error',
                message: 'Invalid GitHub username.',
                position: 'top-center',
            })
            router.push('/')
            return
        }

        let cancelled = false

        async function fetchRoast() {
            try {
                // WHY Promise.all with timer: API call and minimum
                //     display time run in PARALLEL.
                //     Card never flashes in before animation ends.
                const [data] = await Promise.all([
                    getRoast(username),
                    // WHY: this promise resolves after MIN_ANALYSIS_TIME ms
                    new Promise(resolve => setTimeout(resolve, MIN_ANALYSIS_TIME)),
                ])

                // WHY: if user navigated away while fetching, don't update state
                if (cancelled) return

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

                // WHY: different toast message per error type
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

                // WHY: generic fallback for unexpected errors
                createToast({
                    type: 'error',
                    message: 'Something broke. Not your fault... probably.',
                    position: 'top-center',
                })
                router.push('/')
            }
        }

        fetchRoast()

        // WHY cleanup: prevent state updates if component unmounts
        return () => { cancelled = true }
    }, [username, router])

    // ── Views ────────────────────────────────────────────────
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
                            {/* ← ADD THIS BUTTON */}
                            <button
                                className="btn btn-ghost"
                                onClick={() => router.push(`/history/${roastData.username}`)}
                            >
                                📈 History
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => router.push('/')}
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
                            <p className="upsell-title">📈 Monthly Roast Subscription</p>
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
          .nav-logo     { font-size: 22px; }
          .upsell-card  {
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