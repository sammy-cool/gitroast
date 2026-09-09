'use client'

// ============================================================
// GITROAST — LiveRoastFeed Component
// ============================================================
// WHAT: Shows a scrolling ticker of recent roasts on homepage.
//       "Just now @gg got roasted — Grade F — 20/100"
//       Updates every 30 seconds via polling.
//
// WHY this creates WOW:
//   Page feels ALIVE — not static
//   Social proof — others are getting roasted right now
//   FOMO — "they're all doing it, I should too"
//   Voyeurism — people love seeing others get roasted
//
// WHY polling not WebSocket:
//   WebSocket needs persistent connection — expensive on Render free tier
//   30s polling = lightweight, same UX for this use case
//   Feed doesn't need real-time — 30s delay imperceptible
//
// WHY CSS marquee animation:
//   Pure CSS — zero JS animation overhead
//   Smooth infinite scroll
//   Pauses on hover — user can read individual entries
// ============================================================

import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// WHY grade colors match RoastCard exactly — brand consistency
function getScoreColor(score) {
    if (score < 40) return '#FF3D3D'
    if (score < 70) return '#FFB700'
    return '#00E676'
}

// WHY relative time: "2 minutes ago" feels live
//     "2026-04-20T14:23:00Z" feels like a database dump
function getRelativeTime(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

function getIntensityEmoji(intensity) {
    if (intensity === 'mild') return '🌶'
    if (intensity === 'nuclear') return '☢️'
    return '🔥'
}

export default function LiveRoastFeed() {
    const [feed, setFeed] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadFeed() {
        try {
            const res = await fetch(`${API_BASE}/api/roast/feed`)
            const json = await res.json()
            if (json.success && json.feed?.length > 0) {
                setFeed(json.feed)
            }
        } catch {
            // WHY silent: feed failure must never break homepage
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFeed()

        // WHY 30s interval: lightweight polling
        //     balances freshness vs server load
        const interval = setInterval(loadFeed, 30000)
        return () => clearInterval(interval)
    }, [])

    // WHY hide when loading or empty:
    //   New deployments have 0 roasts — don't show empty ticker
    //   Loading state = no flash of empty content
    if (loading || feed.length === 0) return null

    // WHY duplicate feed for seamless loop:
    //   CSS marquee needs content to repeat
    //   Duplicating array = no gap when animation loops
    const displayFeed = [...feed, ...feed]

    return (
        <div className="feed-wrap">
            <div className="feed-label font-mono">🔴 LIVE</div>

            <div className="feed-ticker">
                <div className="feed-track">
                    {displayFeed.map((item, i) => (
                        <a
                            key={`${item._id}-${i}`}
                            href={`/roast/${item.username}`}
                            className="feed-item font-mono"
                            title={`View @${item.username}'s roast`}
                        >
                            <span className="feed-emoji">
                                {getIntensityEmoji(item.intensity)}
                            </span>
                            <span className="feed-username">@{item.username}</span>
                            <span
                                className="feed-score"
                                style={{ color: getScoreColor(item.score) }}
                            >
                                {item.score}/100
                            </span>
                            <span className="feed-grade">Grade {item.grade}</span>
                            <span className="feed-time">{getRelativeTime(item.createdAt)}</span>
                            <span className="feed-sep">·</span>
                        </a>
                    ))}
                </div>
            </div>

            <style jsx>{`
        .feed-wrap {
          display:     flex;
          align-items: center;
          gap:         10px;
          width:       100%;
          max-width:   460px;
          overflow:    hidden;
        }

        /* WHY LIVE badge: signals real-time, adds urgency */
        .feed-label {
          font-size:      9px;
          color:          #FF3D3D;
          letter-spacing: 2px;
          flex-shrink:    0;
          display:        flex;
          align-items:    center;
          gap:            4px;
          animation:      pulse 2s ease-in-out infinite;
        }

        .feed-ticker {
          flex:     1;
          overflow: hidden;
          /* WHY fade edges: ticker fades in/out — feels polished */
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .feed-track {
          display:   flex;
          gap:       0;
          /* WHY animate: scrolls right to left continuously
             20s duration based on ~10 items × ~200px each / viewport
             linear = constant speed = readable */
          animation: ticker 30s linear infinite;
          width:     max-content;
        }

        /* WHY pause on hover: user can read items they're interested in */
        .feed-ticker:hover .feed-track {
          animation-play-state: paused;
        }

        .feed-item {
          display:         flex;
          align-items:     center;
          gap:             6px;
          padding:         0 16px;
          text-decoration: none;
          white-space:     nowrap;
          transition:      opacity 0.15s;
        }
        .feed-item:hover { opacity: 0.7; }

        .feed-emoji    { font-size: 12px; }
        .feed-username { font-size: 12px; color: var(--text-primary); }
        .feed-score    { font-size: 12px; font-weight: 700; }
        .feed-grade    { font-size: 11px; color: var(--text-muted); }
        .feed-time     { font-size: 11px; color: var(--text-ghost); }
        .feed-sep      { font-size: 11px; color: var(--border); }

        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    )
}