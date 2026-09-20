'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import { useAuth } from '@/context/AuthContext'
import Breadcrumb from '@/components/Breadcrumb'

const FEATURED_RIVALRIES = [
    {
        title: 'Kernel vs React',
        tag: 'OS vs Frontend',
        user1: 'torvalds',
        user2: 'gaearon',
        emoji: '🐧 vs ⚛️',
    },
    {
        title: 'Vue vs Svelte',
        tag: 'Framework War',
        user1: 'yyx990803',
        user2: 'rich-harris',
        emoji: '💚 vs 🧡',
    },
    {
        title: 'UI vs Next.js',
        tag: 'Modern Web',
        user1: 'shadcn',
        user2: 'leerob',
        emoji: '🎨 vs ▲',
    },
    {
        title: 'NPM vs Node/Go',
        tag: 'Open Source Titans',
        user1: 'sindresorhus',
        user2: 'tj',
        emoji: '📦 vs 🚀',
    },
    {
        title: 'C vs Rust',
        tag: 'Systems Clash',
        user1: 'antirez',
        user2: 'burntsushi',
        emoji: '⚡ vs 🦀',
    },
]

export default function BattleEntryClient() {
    const { user } = useAuth()
    const [user1, setUser1] = useState('')
    const [user2, setUser2] = useState('')
    const router = useRouter()

    function launchBattle(u1, u2) {
        const p1 = (u1 || user1).trim().toLowerCase()
        const p2 = (u2 || user2).trim().toLowerCase()

        if (!p1 || !p2) {
            createToast({
                type: 'warning',
                message: 'Enter both GitHub usernames to start the battle!',
                position: 'top-center',
                showProgressBar: true,
            })
            return
        }

        if (p1 === p2) {
            createToast({
                type: 'warning',
                message: 'You cannot battle yourself. Or can you? No. You cannot.',
                position: 'top-center',
                duration: 4000,
            })
            return
        }

        router.push(`/battle/${p1}/vs/${p2}`)
    }

    function handleQuickMatch(rivalry) {
        setUser1(rivalry.user1)
        setUser2(rivalry.user2)
        launchBattle(rivalry.user1, rivalry.user2)
    }

    function handleRandomBattle() {
        const pick = FEATURED_RIVALRIES[Math.floor(Math.random() * FEATURED_RIVALRIES.length)]
        setUser1(pick.user1)
        setUser2(pick.user2)
        createToast({
            type: 'info',
            message: `🎲 Selected: @${pick.user1} vs @${pick.user2}!`,
            position: 'top-center',
            duration: 3000,
        })
    }

    function handleFillMyself() {
        if (!user?.username) return
        setUser1(user.username.toLowerCase())
        createToast({
            type: 'info',
            message: `⚔️ Set @${user.username} as Player 1! Pick your opponent.`,
            position: 'top-center',
            duration: 3000,
        })
    }

    function handleSwap() {
        if (!user1 && !user2) return
        const temp = user1
        setUser1(user2)
        setUser2(temp)
    }

    return (
        <main className="battle-entry">
            <div className="battle-glow" />

            {/* Top Navigation */}
            <nav className="battle-top-nav" aria-label="Battle Navigation">
                <button
                    className="btn btn-ghost back-btn"
                    onClick={() => router.push('/')}
                    aria-label="Back to GitRoast Home"
                >
                    ← Home
                </button>
                <div className="battle-nav-actions">
                    <button
                        className="btn btn-ghost random-btn"
                        onClick={handleRandomBattle}
                        title="Pick random famous rivalry"
                    >
                        🎲 Random Rivalry
                    </button>
                    {user?.username && (
                        <button
                            className="btn btn-outline fill-me-btn"
                            onClick={handleFillMyself}
                            title={`Set @${user.username} as Player 1`}
                        >
                            ⚔️ Battle as Me
                        </button>
                    )}
                </div>
            </nav>

            <div className="battle-breadcrumb-wrap">
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Battle Arena' }]} />
            </div>

            {/* Header */}
            <header className="battle-header">
                <div className="battle-badge font-mono">ARENA DEATHMATCH</div>
                <h1 className="font-display battle-title text-fire">
                    ⚔️ ROAST BATTLE
                </h1>
                <p className="font-mono battle-sub">
                    Two developers enter. One roast verdict. Zero survivors.
                </p>
            </header>

            {/* Matchmaking Arena Box */}
            <div className="battle-card card">
                <div className="battle-inputs">
                    {/* Player 1 */}
                    <div className="player-input">
                        <div className="player-label-wrap">
                            <label htmlFor="player1-input" className="player-label font-mono">
                                🔴 PLAYER 1
                            </label>
                            {user?.username && user1.toLowerCase() !== user.username.toLowerCase() && (
                                <button
                                    type="button"
                                    className="use-my-handle-link font-mono"
                                    onClick={handleFillMyself}
                                >
                                    Use me
                                </button>
                            )}
                        </div>
                        <div className="input-wrap">
                            <span className="input-prefix font-mono">github.com/</span>
                            <input
                                id="player1-input"
                                className="battle-input font-mono"
                                placeholder="e.g. torvalds"
                                value={user1}
                                onChange={e => setUser1(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && launchBattle()}
                                maxLength={39}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* VS divider with Swap Button */}
                    <div className="vs-col">
                        <div className="vs-divider font-display" aria-hidden="true">VS</div>
                        <button
                            type="button"
                            className="swap-btn font-mono"
                            onClick={handleSwap}
                            title="Swap contenders"
                            aria-label="Swap Player 1 and Player 2"
                        >
                            ⇄ Swap
                        </button>
                    </div>

                    {/* Player 2 */}
                    <div className="player-input">
                        <div className="player-label-wrap">
                            <label htmlFor="player2-input" className="player-label font-mono">
                                🔵 PLAYER 2
                            </label>
                        </div>
                        <div className="input-wrap">
                            <span className="input-prefix font-mono">github.com/</span>
                            <input
                                id="player2-input"
                                className="battle-input font-mono"
                                placeholder="e.g. gaearon"
                                value={user2}
                                onChange={e => setUser2(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && launchBattle()}
                                maxLength={39}
                            />
                        </div>
                    </div>
                </div>

                {/* Battle Action */}
                <div className="battle-actions">
                    <button
                        className="btn btn-primary battle-btn font-mono"
                        onClick={() => launchBattle()}
                    >
                        ⚔️ START THE BATTLE 🔥
                    </button>
                    <p className="battle-hint font-mono">
                        Instant commit extraction · Comparative shame metrics · AI declares the loser
                    </p>
                </div>
            </div>

            {/* ── Featured Rivalries Section ── */}
            <section className="featured-section" aria-labelledby="featured-heading">
                <h2 id="featured-heading" className="featured-title font-mono">
                    🔥 POPULAR RIVALRIES (1-CLICK BATTLE)
                </h2>
                <div className="rivalries-grid">
                    {FEATURED_RIVALRIES.map((riv, i) => (
                        <button
                            key={i}
                            type="button"
                            className="rivalry-card"
                            onClick={() => handleQuickMatch(riv)}
                            title={`Battle @${riv.user1} vs @${riv.user2}`}
                        >
                            <div className="rivalry-top">
                                <span className="rivalry-tag font-mono">{riv.tag}</span>
                                <span className="rivalry-emoji">{riv.emoji}</span>
                            </div>
                            <div className="rivalry-names font-mono">
                                <span className="riv-u1">@{riv.user1}</span>
                                <span className="riv-vs text-fire font-display">VS</span>
                                <span className="riv-u2">@{riv.user2}</span>
                            </div>
                            <div className="rivalry-cta font-mono">Launch Battle →</div>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Arena Rules / How It Works ── */}
            <section className="rules-section" aria-labelledby="rules-heading">
                <h2 id="rules-heading" className="rules-title font-mono">
                    ⚖️ ARENA RULES & JUDGING CRITERIA
                </h2>
                <div className="rules-grid">
                    <div className="rule-card">
                        <div className="rule-icon">📉</div>
                        <h3 className="rule-name font-display">Shame Differential</h3>
                        <p className="rule-desc font-mono">
                            We pull live repository data for both developers. The developer with the lowest score is officially crowned Most Roastable.
                        </p>
                    </div>
                    <div className="rule-card">
                        <div className="rule-icon">🧟</div>
                        <h3 className="rule-name font-display">Graveyard Index</h3>
                        <p className="rule-desc font-mono">
                            Abandoned tutorial clones, 0-star hobby repos, and dead forks severely penalize the contender&apos;s defense rating.
                        </p>
                    </div>
                    <div className="rule-card">
                        <div className="rule-icon">🤖</div>
                        <h3 className="rule-name font-display">AI Head-to-Head Verdict</h3>
                        <p className="rule-desc font-mono">
                            Gemini AI conducts a comparative analysis of both code histories and synthesizes a brutal verdict declaring the ultimate loser.
                        </p>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .battle-entry {
          min-height:      100vh;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          justify-content: flex-start;
          padding:         1.25rem 1rem 6.5rem;
          gap:             2rem;
          position:        relative;
          overflow-x:      hidden;
          width:           100%;
        }
        .battle-glow {
          position:       absolute;
          inset:          0;
          background:     radial-gradient(
            ellipse 80% 40% at 50% 0%,
            rgba(255, 69, 0, 0.18) 0%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Top Nav */
        .battle-top-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
          max-width:       800px;
          z-index:         10;
        }
        .battle-breadcrumb-wrap {
          width:     100%;
          max-width: 800px;
          margin-top: -0.25rem;
        }
        .battle-nav-actions {
          display:     flex;
          align-items: center;
          gap:         8px;
          flex-wrap:   wrap;
        }
        .random-btn, .fill-me-btn {
          font-size: 12px;
          padding:   6px 12px;
          height:    34px;
        }

        /* Header */
        .battle-header {
          text-align:     center;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            8px;
          margin-top:     -0.5rem;
        }
        .battle-badge {
          font-size:      10px;
          letter-spacing: 2px;
          color:          var(--fire);
          background:     rgba(255, 69, 0, 0.1);
          border:         1px solid rgba(255, 69, 0, 0.3);
          padding:        2px 8px;
          border-radius:  var(--radius-sm);
        }
        .battle-title {
          font-size:   clamp(38px, 9vw, 68px);
          line-height: 1;
        }
        .battle-sub {
          color:     var(--text-secondary);
          font-size: 14px;
          max-width: 460px;
        }

        /* Main Battle Card */
        .battle-card {
          width:          100%;
          max-width:      800px;
          padding:        1.75rem;
          display:        flex;
          flex-direction: column;
          gap:            1.5rem;
          background:     var(--bg-card);
          border:         1px solid var(--border);
          border-radius:  var(--radius-lg);
          box-shadow:     0 8px 32px rgba(0, 0, 0, 0.4);
          z-index:        5;
        }

        /* Inputs layout */
        .battle-inputs {
          display:     flex;
          align-items: center;
          gap:         1.25rem;
          width:       100%;
        }
        .player-input {
          display:        flex;
          flex-direction: column;
          gap:            8px;
          flex:           1;
          min-width:      0;
        }
        .player-label-wrap {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
        }
        .player-label {
          font-size:      11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color:          var(--text-muted);
          font-weight:    600;
        }
        .use-my-handle-link {
          background:  none;
          border:      none;
          color:       var(--fire);
          font-size:   11px;
          cursor:      pointer;
          padding:     0;
          text-decoration: underline;
        }
        .input-wrap {
          display:       flex;
          align-items:   center;
          background:    var(--bg-input);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          overflow:      hidden;
          transition:    border-color 0.18s;
        }
        .input-wrap:focus-within {
          border-color: var(--fire);
          box-shadow:   0 0 12px rgba(255, 69, 0, 0.2);
        }
        .input-prefix {
          padding:      0 10px;
          font-size:    12px;
          color:        var(--text-muted);
          white-space:  nowrap;
          border-right: 1px solid var(--border);
        }
        .battle-input {
          flex:       1;
          padding:    12px 14px;
          background: transparent;
          border:     none;
          outline:    none;
          color:      var(--text-primary);
          font-size:  14px;
          min-width:  0;
        }
        .battle-input::placeholder { color: var(--text-muted); }

        .vs-col {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            4px;
          flex-shrink:    0;
        }
        .vs-divider {
          font-size: 28px;
          color:     var(--fire);
          line-height: 1;
        }
        .swap-btn {
          background:    transparent;
          border:        1px solid var(--border);
          color:         var(--text-secondary);
          font-size:     10px;
          padding:       2px 6px;
          border-radius: var(--radius-sm);
          cursor:        pointer;
          transition:    all 0.15s ease;
        }
        .swap-btn:hover {
          border-color: var(--fire);
          color:        var(--text-primary);
        }

        /* Action Buttons */
        .battle-actions {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            10px;
          width:          100%;
        }
        .battle-btn {
          padding:        14px 32px;
          font-size:      16px;
          width:          100%;
          max-width:      360px;
          font-weight:    700;
          letter-spacing: 0.5px;
        }
        .battle-hint {
          font-size:  12px;
          color:      var(--text-muted);
          text-align: center;
        }

        /* Featured Rivalries */
        .featured-section {
          width:     100%;
          max-width: 800px;
          display:   flex;
          flex-direction: column;
          gap:       12px;
        }
        .featured-title {
          font-size:      11px;
          letter-spacing: 1.5px;
          color:          var(--text-muted);
        }
        .rivalries-grid {
          display:               grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap:                   10px;
          width:                 100%;
        }
        .rivalry-card {
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          padding:       12px 14px;
          display:       flex;
          flex-direction: column;
          gap:           6px;
          cursor:        pointer;
          text-align:    left;
          transition:    all 0.18s ease;
        }
        .rivalry-card:hover {
          border-color: var(--fire);
          transform:    translateY(-2px);
          box-shadow:   0 6px 20px rgba(255, 69, 0, 0.12);
        }
        .rivalry-top {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
        }
        .rivalry-tag {
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color:          var(--text-muted);
        }
        .rivalry-emoji {
          font-size: 14px;
        }
        .rivalry-names {
          display:     flex;
          align-items: center;
          gap:         6px;
          font-size:   13px;
          color:       var(--text-primary);
        }
        .riv-vs {
          font-size: 15px;
        }
        .rivalry-cta {
          font-size:  10px;
          color:      var(--fire);
          margin-top: 2px;
        }

        /* Rules section */
        .rules-section {
          width:     100%;
          max-width: 800px;
          display:   flex;
          flex-direction: column;
          gap:       12px;
        }
        .rules-title {
          font-size:      11px;
          letter-spacing: 1.5px;
          color:          var(--text-muted);
        }
        .rules-grid {
          display:               grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap:                   12px;
        }
        .rule-card {
          background:    var(--bg-card);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          padding:       16px;
          display:       flex;
          flex-direction: column;
          gap:           6px;
        }
        .rule-icon { font-size: 22px; }
        .rule-name { font-size: 18px; color: var(--text-primary); }
        .rule-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }

        @media (max-width: 640px) {
          .battle-inputs {
            flex-direction: column;
            gap: 1rem;
          }
          .vs-col {
            flex-direction: row;
            gap: 12px;
          }
          .battle-top-nav {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .battle-nav-actions {
            width: 100%;
            justify-content: space-between;
          }
          .battle-btn {
            max-width: 100%;
          }
        }
      `}</style>
        </main>
    )
}
