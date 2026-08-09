'use client'

// ============================================================
// GITROAST — RateLimitBanner Component
// ============================================================
// WHAT: Shows a live countdown timer when user hits rate limit.
//       Appears at top of landing page — disappears when timer ends.
//
// WHY a banner not just a toast:
//   Toast disappears after a few seconds
//   User still tries to roast → confused why it doesn't work
//   Banner stays visible with live countdown → user knows to wait
//   Disappears automatically when they can roast again ✅
//
// HOW countdown works:
//   Parent passes retryAfter seconds
//   useEffect runs setInterval every second
//   Decrements counter → updates display
//   When reaches 0 → calls onExpired → banner unmounts
//
// WHERE: Rendered in home_page.jsx when rate limit hit
//        Also usable on /battle page
// ============================================================

import { useState, useEffect } from 'react'

export default function RateLimitBanner({ seconds, onExpired }) {
    const [remaining, setRemaining] = useState(seconds)

    useEffect(() => {
        if (remaining <= 0) {
            onExpired?.()
            return
        }

        // WHY setInterval 1000ms:
        //   Updates every second — shows live countdown
        //   Gives user clear sense of progress
        const timer = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onExpired?.()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // WHY percentage: drives the progress bar width
    const percentage = Math.round((remaining / seconds) * 100)

    return (
        <div className="rl-banner">

            <div className="rl-content">
                {/* Icon + message */}
                <span className="rl-icon">⏱</span>
                <div className="rl-text">
                    <p className="rl-title font-mono">Rate limit reached</p>
                    <p className="rl-sub font-mono">
                        You can roast again in{' '}
                        <span className="rl-seconds">{remaining}s</span>
                    </p>
                </div>

                {/* Live countdown circle */}
                <div className="rl-timer font-display">
                    {remaining}
                </div>
            </div>

            {/* Progress bar — drains as countdown decreases */}
            <div className="rl-track">
                <div
                    className="rl-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <style jsx>{`
        .rl-banner {
          width:         100%;
          max-width:     460px;
          background:    rgba(255, 183, 0, 0.06);
          border:        1px solid rgba(255, 183, 0, 0.25);
          border-radius: var(--radius-md);
          overflow:      hidden;
          animation:     fadeIn 0.3s ease forwards;
        }
        .rl-content {
          display:     flex;
          align-items: center;
          gap:         12px;
          padding:     12px 16px;
        }
        .rl-icon  { font-size: 20px; flex-shrink: 0; }
        .rl-text  { flex: 1; }
        .rl-title {
          font-size:   12px;
          color:       var(--warn);
          letter-spacing: 0.5px;
        }
        .rl-sub {
          font-size:  11px;
          color:      var(--text-secondary);
          margin-top: 2px;
        }
        .rl-seconds { color: var(--warn); font-weight: 700; }

        /* Live countdown number */
        .rl-timer {
          font-size:    28px;
          color:        var(--warn);
          flex-shrink:  0;
          min-width:    44px;
          text-align:   right;
          line-height:  1;
        }

        /* Draining progress bar */
        .rl-track {
          height:     2px;
          background: rgba(255, 183, 0, 0.15);
        }
        .rl-fill {
          height:     100%;
          background: var(--warn);
          transition: width 0.9s linear;
        }
      `}</style>
        </div>
    )
}