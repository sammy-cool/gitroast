'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'

export default function BattleEntryClient() {
    const [user1, setUser1] = useState('')
    const [user2, setUser2] = useState('')
    const router = useRouter()

    function handleBattle() {
        const u1 = user1.trim().toLowerCase()
        const u2 = user2.trim().toLowerCase()

        if (!u1 || !u2) {
            createToast({
                type: 'warning',
                message: 'Enter both GitHub usernames to start the battle!',
                position: 'top-center',
                showProgressBar: true,
            })
            return
        }

        if (u1 === u2) {
            createToast({
                type: 'warning',
                message: 'You cannot battle yourself. Or can you? No. You cannot.',
                position: 'top-center',
                duration: 4000,
            })
            return
        }

        // WHY slug format "user1/vs/user2":
        //     readable URL, shareable, parseable on backend
        router.push(`/battle/${u1}/vs/${u2}`)
    }

    return (
        <main className="battle-entry">
            <div className="battle-glow" />

            {/* Back to home */}
            <button
                className="btn btn-ghost back-btn"
                onClick={() => router.push('/')}
                aria-label="Back to GitRoast Home"
            >
                ← Home
            </button>

            {/* Header */}
            <header className="battle-header">
                <h1 className="font-display battle-title text-fire">
                    ⚔️ ROAST BATTLE
                </h1>
                <p className="font-mono battle-sub">
                    Two developers. One roast. Zero survivors.
                </p>
            </header>

            {/* Two inputs side by side */}
            <div className="battle-inputs">
                <div className="player-input">
                    <label htmlFor="player1-input" className="player-label font-mono">
                        🔴 PLAYER 1
                    </label>
                    <div className="input-wrap">
                        <span className="input-prefix font-mono">github.com/</span>
                        <input
                            id="player1-input"
                            className="battle-input font-mono"
                            placeholder="username"
                            value={user1}
                            onChange={e => setUser1(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBattle()}
                            maxLength={39}
                            autoFocus
                        />
                    </div>
                </div>

                {/* VS divider */}
                <div className="vs-divider font-display" aria-hidden="true">VS</div>

                <div className="player-input">
                    <label htmlFor="player2-input" className="player-label font-mono">
                        🔵 PLAYER 2
                    </label>
                    <div className="input-wrap">
                        <span className="input-prefix font-mono">github.com/</span>
                        <input
                            id="player2-input"
                            className="battle-input font-mono"
                            placeholder="username"
                            value={user2}
                            onChange={e => setUser2(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBattle()}
                            maxLength={39}
                        />
                    </div>
                </div>
            </div>

            {/* Battle button */}
            <button
                className="btn btn-primary battle-btn"
                onClick={handleBattle}
            >
                ⚔️ START THE BATTLE
            </button>

            <p className="battle-hint font-mono">
                Scores compared · AI picks the winner · Both get roasted
            </p>

            <style jsx>{`
        .battle-entry {
          min-height:      100vh;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          justify-content: center;
          padding:         2rem 1rem 6.5rem;
          gap:             1.5rem;
          position:        relative;
          overflow:        hidden;
        }
        .battle-glow {
          position:       absolute;
          inset:          0;
          background:     radial-gradient(
            ellipse 70% 40% at 50% 100%,
            rgba(255, 69, 0, 0.18) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .back-btn {
          position: absolute;
          top:      1.25rem;
          left:     1.25rem;
        }
        .battle-header { text-align: center; }
        .battle-title  { font-size: clamp(40px, 10vw, 72px); line-height: 1; }
        .battle-sub    { color: var(--text-secondary); font-size: 14px; margin-top: 8px; }

        /* Inputs */
        .battle-inputs {
          display:     flex;
          align-items: center;
          gap:         1.5rem;
          width:       100%;
          max-width:   700px;
          flex-wrap:   wrap;
          justify-content: center;
        }
        .player-input {
          display:        flex;
          flex-direction: column;
          gap:            8px;
          flex:           1;
          min-width:      200px;
        }
        .player-label {
          font-size:      10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color:          var(--text-muted);
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
        }
        .input-prefix {
          padding:    0 10px;
          font-size:  12px;
          color:      var(--text-muted);
          white-space:nowrap;
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
        }
        .battle-input::placeholder { color: var(--text-muted); }

        .vs-divider {
          font-size:   32px;
          color:       var(--fire);
          flex-shrink: 0;
        }

        .battle-btn {
          padding:    14px 40px;
          font-size:  16px;
          max-width:  300px;
          width:      100%;
        }
        .battle-hint {
          font-size: 12px;
          color:     var(--text-muted);
        }

        @media (max-width: 540px) {
          .battle-inputs { flex-direction: column; }
          .vs-divider    { transform: rotate(90deg); }
        }
      `}</style>
        </main>
    )
}
