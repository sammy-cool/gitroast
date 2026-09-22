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
import Link from 'next/link'
import { getRoastFeed } from '@/services/roastService'

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
            const data = await getRoastFeed()
            if (data?.length > 0) {
                setFeed(data)
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
        const interval = setInterval(() => {
          if (!document.hidden) loadFeed();
        }, 30000)
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
                        <Link
                            key={`${item._id}-${i}`}
                            href={`/history/${item.username}`}
                            className="feed-link"
                            title={`View @${item.username}'s roast`}
                        >
                            <div className="feed-item font-mono">
                                <span className="feed-avatar-box">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://avatars.githubusercontent.com/${item.username}?s=32`}
                                        alt={item.username}
                                        className="feed-avatar"
                                        crossOrigin="anonymous"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                </span>
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
                            </div>
                        </Link>
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

        .feed-track :global(.feed-link) {
          text-decoration: none;
          display:         inline-flex;
          color:           inherit;
        }

        .feed-item {
          display:         flex;
          align-items:     center;
          gap:             6px;
          padding:         0 14px;
          white-space:     nowrap;
          transition:      opacity 0.15s;
        }
        .feed-item:hover { opacity: 0.7; }

        .feed-avatar-box {
          width:           16px;
          height:          16px;
          border-radius:   50%;
          overflow:        hidden;
          display:         inline-flex;
          align-items:     center;
          justify-content: center;
          background:      #1a1a1a;
          flex-shrink:     0;
        }
        .feed-avatar {
          width:       100%;
          height:      100%;
          object-fit:  cover;
          border-radius: 50%;
        }

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