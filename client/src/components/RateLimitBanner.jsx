'use client'


import { useState, useEffect } from 'react'

export default function RateLimitBanner({ seconds, onExpired }) {
    const [prevSeconds, setPrevSeconds] = useState(seconds)
    const [remaining, setRemaining] = useState(seconds)

    if (seconds !== prevSeconds) {
        setPrevSeconds(seconds)
        setRemaining(seconds)
    }

    useEffect(() => {
        if (seconds <= 0) {
            onExpired?.()
            return
        }

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
    }, [seconds, onExpired])

    const totalSecs = seconds > 0 ? seconds : 1
    const percentage = Math.min(100, Math.max(0, Math.round((remaining / totalSecs) * 100)))

    return (
        <div className="rl-banner">

            <div className="rl-content">
                {}
                <span className="rl-icon">⏱</span>
                <div className="rl-text">
                    <p className="rl-title font-mono">Rate limit reached</p>
                    <p className="rl-sub font-mono">
                        You can roast again in{' '}
                        <span className="rl-seconds">{remaining}s</span>
                    </p>
                </div>

                {}
                <div className="rl-timer font-display">
                    {remaining}
                </div>
            </div>

            {}
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
          background:    rgba(230, 184, 74, 0.06);
          border:        1px solid rgba(230, 184, 74, 0.25);
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
          background: rgba(230, 184, 74, 0.15);
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

