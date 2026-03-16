'use client'

// WHY useState + useEffect: we animate lines appearing
//     one by one over time — that requires state + timers
import { useState, useEffect } from 'react'

// WHY: these are the steps shown in the terminal
//      they match what actually happens behind the scenes
const ANALYSIS_STEPS = [
    { text: 'Connecting to GitHub API...', delay: 0 },
    { text: 'Fetching public repositories...', delay: 700 },
    { text: 'Scanning commit messages for trauma...', delay: 1400 },
    { text: 'Judging README quality...', delay: 2100 },
    { text: 'Counting abandoned repos...', delay: 2800 },
    { text: 'Analyzing language choices...', delay: 3500 },
    { text: 'Calculating shame index...', delay: 4200 },
    { text: 'Crafting your personalized roast...', delay: 4900 },
]

// WHY username prop: so we show "@torvalds" in terminal header
export default function AnalyzingScreen({ username }) {
    // WHY: tracks how many steps are currently visible
    const [visibleSteps, setVisibleSteps] = useState(0)

    useEffect(() => {
        // WHY: for each step, set a timer to reveal it at the right delay
        const timers = ANALYSIS_STEPS.map((step, index) =>
            setTimeout(() => {
                // WHY +1: we want to show steps 1 by 1, not all at once
                setVisibleSteps(index + 1)
            }, step.delay)
        )

        // WHY cleanup: if user navigates away, clear all timers
        //     prevents memory leaks + state updates on unmounted component
        return () => timers.forEach(clearTimeout)
    }, []) // WHY []: run only once when component mounts

    // WHY: progress = how many steps done out of total
    const progress = Math.round((visibleSteps / ANALYSIS_STEPS.length) * 100)

    return (
        <div className="analyzing-wrap">

            {/* ── Terminal window ──────────────────────── */}
            <div className="terminal">

                {/* Terminal title bar — like a real Mac/Linux terminal */}
                <div className="terminal-bar">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                    <span className="terminal-title font-mono">
                        gitroast — roasting @{username}
                    </span>
                </div>

                {/* Terminal body */}
                <div className="terminal-body">

                    {/* WHY: first line is always visible — the command itself */}
                    <p className="terminal-cmd font-mono">
                        $ gitroast analyze --savage {username}
                    </p>

                    {/* Render only the visible steps */}
                    {ANALYSIS_STEPS.slice(0, visibleSteps).map((step, i) => (
                        <div
                            key={i}
                            className="terminal-line animate-fadeUp font-mono"
                        >
                            {/* WHY: last visible step gets blinking cursor */}
                            {i === visibleSteps - 1 ? (
                                <>
                                    <span className="step-active">{step.text}</span>
                                    <span className="cursor animate-blink" />
                                </>
                            ) : (
                                // WHY: completed steps show a checkmark
                                <span className="step-done">{step.text} ✓</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Progress bar ─────────────────────────── */}
            <div className="progress-wrap">
                <div className="progress-labels font-mono">
                    <span>Roasting in progress</span>
                    <span style={{ color: 'var(--fire)' }}>{progress}%</span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <style jsx>{`
        .analyzing-wrap {
          min-height:      100vh;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          justify-content: center;
          padding:         2rem 1rem;
          gap:             1.25rem;
        }
        /* ── Terminal ── */
        .terminal {
          width:         100%;
          max-width:     520px;
          background:    #080808;
          border:        1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow:      hidden;
        }
        .terminal-bar {
          display:       flex;
          align-items:   center;
          gap:           7px;
          padding:       10px 16px;
          background:    #0E0E0E;
          border-bottom: 1px solid var(--border);
        }
        .dot {
          width:         11px;
          height:        11px;
          border-radius: 50%;
          opacity:       0.85;
        }
        .dot-red    { background: #FF5F56; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green  { background: #27C93F; }
        .terminal-title {
          margin-left: 8px;
          color:       var(--text-muted);
          font-size:   12px;
        }
        .terminal-body {
          padding:    1.25rem 1.5rem;
          min-height: 220px;
          display:    flex;
          flex-direction: column;
          gap:        2px;
        }
        .terminal-cmd {
          color:         var(--fire);
          font-size:     13px;
          margin-bottom: 12px;
        }
        .terminal-line {
          font-size:   13px;
          line-height: 2;
        }
        .step-active { color: var(--text-primary); }
        .step-done   { color: var(--text-muted);   }
        .cursor {
          display:          inline-block;
          width:            2px;
          height:           13px;
          background:       var(--fire);
          vertical-align:   middle;
          margin-left:      4px;
          border-radius:    1px;
        }
        /* ── Progress ── */
        .progress-wrap {
          width:     100%;
          max-width: 520px;
        }
        .progress-labels {
          display:         flex;
          justify-content: space-between;
          font-size:       12px;
          color:           var(--text-muted);
          margin-bottom:   6px;
        }
        .progress-track {
          height:        3px;
          background:    #111;
          border-radius: 2px;
          overflow:      hidden;
        }
        .progress-fill {
          height:        100%;
          background:    var(--fire-grad);
          border-radius: 2px;
          transition:    width 0.5s ease;
        }
      `}</style>
        </div>
    )
}