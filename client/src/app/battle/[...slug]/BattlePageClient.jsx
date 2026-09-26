'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/utils/toast'
import BattleCard from '@/components/BattleCard'
import Breadcrumb from '@/components/Breadcrumb'
import { getBattleRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'

const MIN_BATTLE_TIME = 6000

const BATTLE_STEPS = [
    { text: 'Fetching challenger profiles...', delay: 0 },
    { text: 'Analyzing Player 1 commit history...', delay: 800 },
    { text: 'Analyzing Player 2 commit history...', delay: 1600 },
    { text: 'Comparing shame indexes...', delay: 2400 },
    { text: 'Calculating who abandoned more repos...', delay: 3200 },
    { text: 'AI entering the arena...', delay: 4000 },
    { text: 'Declaring the loser...', delay: 4800 },
    { text: 'Both developers destroyed. Preparing verdict...', delay: 5600 },
]

export default function BattlePageClient({ user1, user2 }) {
    const [view, setView] = useState('analyzing')
    const [battleData, setBattleData] = useState(null)
    const [visibleSteps, setVisibleSteps] = useState(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const isRematch = searchParams?.get('rematch') === 'true'
    const { getToken } = useAuth()

    // ── Animation ─────────────────────────────────────────────
    useEffect(() => {
        const timers = BATTLE_STEPS.map((step, i) =>
            setTimeout(() => setVisibleSteps(i + 1), step.delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    // ── Fetch ─────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false

        async function fetchBattle() {
            // ── Bidirectional Battle Session Cache ───────────────────────
            // ── WHAT: ────────────────────────────────────────────────────
            // Caches battle match results in browser sessionStorage by sorted pair key.
            // ── WHY: ─────────────────────────────────────────────────────
            // Prevents re-running identical 2x GitHub fetches when navigating back
            // from a history link or refreshing the showdown page.
            // ── WHERE & WHEN TO USE: ─────────────────────────────────────
            // On head-to-head battle display components with slug URL parameters.
            // ── USE CASES: ───────────────────────────────────────────────
            // Back-button navigation after copying battle challenge link.
            // ── WHEN NOT TO USE: ─────────────────────────────────────────
            // When rematch button is explicitly clicked (?rematch=true) to force a re-roll.
            const pairKey = [(user1 || '').toLowerCase(), (user2 || '').toLowerCase()].sort().join('-vs-')
            const cacheKey = `gitroast_battle_${pairKey}`
            if (!isRematch) {
                try {
                    const cached = sessionStorage.getItem(cacheKey)
                    if (cached) {
                        const parsed = JSON.parse(cached)
                        if (Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
                            if (cancelled) return
                            setBattleData(parsed.data)
                            setView('result')
                            return
                        }
                    }
                } catch {
                    // Ignore storage exceptions in private mode
                }
            }

            try {
                const token = getToken()

                const [data] = await Promise.all([
                    getBattleRoast(user1, user2, token, isRematch),
                    new Promise(resolve => setTimeout(resolve, MIN_BATTLE_TIME)),
                ])

                if (cancelled) return

                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
                } catch {
                    // Ignore storage quota exceeded
                }

                setBattleData(data)
                setView('result')

                toast.battleComplete(data.winner)

            } catch (err) {
                if (cancelled) return

                // WHY differentiate rate limit vs other errors:
                //   Same fix as RoastPageClient — shows exact retryAfter seconds
                //   err.retryAfter set by getBattleRoast in roastService.js
                const isLoggedIn = !!getToken();
                if (err.code === 'CAPTCHA_REQUIRED' || err.code === 'CAPTCHA_FAILED') {
                    toast.warning(
                        err.message || (isLoggedIn ? 'Bot verification check could not be completed. Please try again.' : 'Bot verification blocked by browser shield. Please log in with GitHub to battle!'),
                        {
                            duration: 8000,
                            ...(!isLoggedIn && {
                                cta: {
                                    label: 'Login via GitHub ↗',
                                    onClick: () => {
                                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                                        window.location.href = `${apiBase}/api/auth/github`
                                    },
                                    autoClose: true,
                                },
                            }),
                        }
                    )
                } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    toast.rateLimit(
                        err.retryAfter,
                        !isLoggedIn
                            ? () => {
                                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                                window.location.href = `${apiBase}/api/auth/github`
                            }
                            : null
                    )
                } else {
                    toast.error(err.message || 'Battle failed. Check both usernames.')
                }
                router.push('/battle')
            }
        }

        fetchBattle()
        return () => { cancelled = true }
    }, [user1, user2, router, getToken, isRematch])

    const progress = Math.round((visibleSteps / BATTLE_STEPS.length) * 100)

    // ── Analyzing view ────────────────────────────────────────
    if (view === 'analyzing') {
        return (
            <div className="battle-analyzing">
                <div className="battle-glow" />

                <div className="terminal">
                    <div className="terminal-bar">
                        <span className="dot dot-red" />
                        <span className="dot dot-yellow" />
                        <span className="dot dot-green" />
                        <span className="terminal-title font-mono">
                            gitroast — battle @{user1} vs @{user2}
                        </span>
                    </div>
                    <div className="terminal-body">
                        <p className="terminal-cmd font-mono">
                            $ gitroast battle --savage @{user1} @{user2}
                        </p>
                        {BATTLE_STEPS.slice(0, visibleSteps).map((step, i) => (
                            <div key={i} className="terminal-line animate-fadeUp font-mono">
                                {i === visibleSteps - 1 ? (
                                    <>
                                        <span style={{ color: 'var(--text-primary)' }}>{step.text}</span>
                                        <span className="cursor animate-blink" />
                                    </>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>{step.text} ✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="progress-wrap">
                    <div className="progress-labels font-mono">
                        <span>Battle in progress</span>
                        <span style={{ color: 'var(--fire)' }}>{progress}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <style jsx>{`
          .battle-analyzing {
            min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            /* WHY 6.5rem bottom padding: prevents fixed site footer from overlapping analyzing terminal on mobile */
            padding: 2rem 1rem 6.5rem; gap: 1.25rem; position: relative;
          }
          .battle-glow {
            position: absolute; inset: 0;
            background: radial-gradient(ellipse 70% 40% at 50% 100%, rgba(255,69,0,0.15) 0%, transparent 100%);
            pointer-events: none;
          }
          .terminal {
            width: 100%; max-width: 560px; background: #080808;
            border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;
          }
          .terminal-bar {
            display: flex; align-items: center; gap: 7px;
            padding: 10px 16px; background: #0E0E0E; border-bottom: 1px solid var(--border);
          }
          .dot { width: 11px; height: 11px; border-radius: 50%; opacity: 0.85; }
          .dot-red    { background: #FF5F56; }
          .dot-yellow { background: #FFBD2E; }
          .dot-green  { background: #27C93F; }
          .terminal-title { margin-left: 8px; color: var(--text-muted); font-size: 12px; }
          .terminal-body {
            padding: 1.25rem 1.5rem; min-height: 240px;
            display: flex; flex-direction: column; gap: 2px;
          }
          .terminal-cmd  { color: var(--fire); font-size: 13px; margin-bottom: 12px; }
          .terminal-line { font-size: 13px; line-height: 2; }
          .cursor {
            display: inline-block; width: 2px; height: 13px;
            background: var(--fire); vertical-align: middle;
            margin-left: 4px; border-radius: 1px;
          }
          .progress-wrap { width: 100%; max-width: 560px; }
          .progress-labels {
            display: flex; justify-content: space-between;
            font-size: 12px; color: var(--text-muted); margin-bottom: 6px;
          }
          .progress-track { height: 3px; background: #111; border-radius: 2px; overflow: hidden; }
          .progress-fill {
            height: 100%; background: var(--fire-grad);
            border-radius: 2px; transition: width 0.5s ease;
          }
        `}</style>
            </div>
        )
    }

    // ── Result view ───────────────────────────────────────────
    if (view === 'result' && battleData) {
        return (
            <>
                <main className="battle-result">
                    <div className="battle-nav">
                        <div className="font-display nav-logo text-fire">GITROAST ⚔️</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href="/battle" className="btn btn-ghost">
                                ⚔️ New Battle
                            </Link>
                            <Link href="/" className="btn btn-ghost">
                                ← Home
                            </Link>
                        </div>
                    </div>
                    <div className="breadcrumb-container">
                        <Breadcrumb
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'Battle Arena', href: '/battle' },
                                { label: `@${user1} vs @${user2}` },
                            ]}
                        />
                    </div>
                    <BattleCard data={battleData} />
                </main>

                <style jsx>{`
          .battle-result {
            min-height: 100vh; display: flex; flex-direction: column;
            align-items: center;
            /* 
              ── WHAT: ────────────────────────────────────────────────────────
              Battle result page layout padding.
              
              ── WHY: ─────────────────────────────────────────────────────────
              Per AGENTS.md Rule 2.3, the fixed site footer requires at least 6.5rem
              clearance so the battle card and navigation footer are never obscured.
              
              ── WHERE & WHEN TO USE: ─────────────────────────────────────────
              Top-level battle results page wrapper.
              
              ── USE CASES: ───────────────────────────────────────────────────
              Displaying completed 1v1 battle comparisons.
              
              ── WHEN NOT TO USE: ─────────────────────────────────────────────
              Inner battle card components.
            */
            padding: 1.5rem 1rem 6.5rem; gap: 1.25rem;
          }
          .battle-nav {
            display: flex; justify-content: space-between; align-items: center;
            width: 100%; max-width: 680px;
          }
          .nav-logo { font-size: 22px; }
          .breadcrumb-container {
            width: 100%;
            max-width: 680px;
            margin-bottom: -0.25rem;
          }
        `}</style>
            </>
        )
    }

    return null
}