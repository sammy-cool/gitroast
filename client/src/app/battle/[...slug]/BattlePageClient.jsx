'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import BattleCard from '@/components/BattleCard'
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
    const { getToken } = useAuth()

    // ── Animation ─────────────────────────────────────────────
    useEffect(() => {
        const timers = BATTLE_STEPS.map((step, i) =>
            setTimeout(() => setVisibleSteps(i + 1), step.delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    // ── Fetch ─────────────────────────────────────────────────
    // WHY no fetchStarted ref:
    //   fetchStarted blocks Mount 2 in StrictMode permanently
    //   Mount 1: starts fetch → StrictMode cleanup → cancelled = true
    //   Mount 2: fetchStarted = true → exits → NO fetch ever runs → stuck
    //
    //   Without fetchStarted:
    //   Mount 1: fetch starts → cancelled = true → ignored ✓
    //   Mount 2: fetch starts fresh → completes → result shown ✓
    //
    //   cancelled flag is still kept — handles user navigating AWAY
    //   mid-fetch to prevent setState on unmounted component
    useEffect(() => {
        let cancelled = false

        async function fetchBattle() {
            try {
                const token = getToken()

                const [data] = await Promise.all([
                    getBattleRoast(user1, user2, token),
                    new Promise(resolve => setTimeout(resolve, MIN_BATTLE_TIME)),
                ])

                if (cancelled) return

                setBattleData(data)
                setView('result')

                createToast({
                    type: 'success',
                    message: data.winner
                        ? `⚔️ Battle complete! @${data.winner} is the most roastable!`
                        : '⚔️ Battle complete! It\'s a draw — equally shameful.',
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 4000,
                })

            } catch (err) {
                if (cancelled) return

                createToast({
                    type: 'error',
                    message: err.message || 'Battle failed. Check both usernames.',
                    position: 'top-center',
                    duration: 5000,
                    showCloseButton: true,
                })
                router.push('/battle')
            }
        }

        fetchBattle()
        return () => { cancelled = true }
    }, [user1, user2, router])

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
            padding: 2rem 1rem; gap: 1.25rem; position: relative;
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
          .terminal-cmd { color: var(--fire); font-size: 13px; margin-bottom: 12px; }
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
                            <button className="btn btn-ghost" onClick={() => router.push('/battle')}>
                                ⚔️ New Battle
                            </button>
                            <button className="btn btn-ghost" onClick={() => router.push('/')}>
                                ← Home
                            </button>
                        </div>
                    </div>

                    <BattleCard data={battleData} />
                </main>

                <style jsx>{`
          .battle-result {
            min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; padding: 1.5rem 1rem 6rem; gap: 1.25rem;
          }
          .battle-nav {
            display: flex; justify-content: space-between; align-items: center;
            width: 100%; max-width: 680px;
          }
          .nav-logo { font-size: 22px; }
        `}</style>
            </>
        )
    }

    return null
}