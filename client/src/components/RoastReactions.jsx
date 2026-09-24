'use client'

// ============================================================
// GITROAST — Enhanced RoastReactions Component
// ============================================================
// WHAT: Three interactive emoji reaction buttons on every roast card:
//       😂 Relatable  💀 Destroyed  🔥 Savage
//
// WHY & FLOW:
//   - "Be the first to react" callout with fire amber styling when total == 0
//   - Immediate tactile feedback (+1 float burst, mobile haptic micro-vibrate)
//   - LocalStorage persistence across page reloads/sessions so users immediately
//     see their locked-in reaction (✓) without duplicate server requests
//   - Dynamic social proof:
//       - 0 reactions: "🔥 Be the first to react to this burn! 👇"
//       - User reacted 1st: "🎉 You were the first to react! · 1 reaction"
//       - User reacted with others: "✓ You reacted · N total reactions"
//       - User hasn't reacted: "N reactions · How brutal was this? Tap to react 👇"
//   - Included inside #roast-card-capture so downloaded PNG cards capture
//     live reactions and social proof!
// ============================================================

import { useState, useEffect } from 'react'
import { createToast } from 'customizable-toast-notification'
import { reactToRoast, reactToBattle } from '@/services/roastService'

const REACTION_CONFIG = [
    { type: 'relatable', emoji: '😂', label: 'Relatable' },
    { type: 'destroyed', emoji: '💀', label: 'Destroyed' },
    { type: 'savage', emoji: '🔥', label: 'Savage' },
]

export default function RoastReactions({ roastId, initialReactions = {}, targetType = 'roast' }) {
    const [counts, setCounts] = useState(() => ({
        relatable: initialReactions?.relatable || 0,
        destroyed: initialReactions?.destroyed || 0,
        savage: initialReactions?.savage || 0,
    }))

    const storageKey = targetType === 'battle'
        ? `gitroast_reacted_battle_${roastId}`
        : `gitroast_reacted_${roastId}`

    // Initialize clicked reactions directly from localStorage on mount (zero cascading renders)
    const [clicked, setClicked] = useState(() => {
        if (!roastId || typeof window === 'undefined') return new Set()
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    return new Set(parsed)
                }
            }
        } catch {
            // LocalStorage inaccessible (Safari strict mode or private browsing)
        }
        return new Set()
    })

    const [loading, setLoading] = useState(null)
    const [justReactedType, setJustReactedType] = useState(null)

    // ── React 19 State Adjustment During Render ───────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Synchronizes local counts and locked reaction sets when async props update.
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Complies with React 19 / Next.js 16 guidelines: adjusting state during render
    // (instead of inside useEffect) avoids cascading renders and re-render thrashing.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // When local state must reflect async changes from parent props.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // Updating reaction counts after server response resolves.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not call setState unconditionally in render (causes infinite loops).
    const [prevInitial, setPrevInitial] = useState(initialReactions)
    if (initialReactions && initialReactions !== prevInitial) {
        setPrevInitial(initialReactions)
        setCounts({
            relatable: initialReactions.relatable || 0,
            destroyed: initialReactions.destroyed || 0,
            savage: initialReactions.savage || 0,
        })
    }

    const [prevRoastId, setPrevRoastId] = useState(roastId)
    if (roastId !== prevRoastId) {
        setPrevRoastId(roastId)
        if (typeof window !== 'undefined' && roastId) {
            try {
                const stored = localStorage.getItem(storageKey)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (Array.isArray(parsed)) {
                        setClicked(new Set(parsed))
                    }
                }
            } catch {
                // Ignore
            }
        }
    }

    async function handleReact(type) {
        // Prevent double reacting to same emoji type
        if (clicked.has(type) || loading) return

        if (!roastId) {
            createToast({
                type: 'warning',
                message: `${targetType === 'battle' ? 'Battle' : 'Roast'} is still saving, please wait a moment!`,
                position: 'top-center',
                duration: 2500,
            })
            return
        }

        // Haptic feedback for mobile devices
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20)
        }

        setLoading(type)
        setJustReactedType(type)
        setTimeout(() => setJustReactedType(null), 1000)

        // Optimistic UI update
        const prev = counts[type] || 0
        setCounts(c => ({ ...c, [type]: prev + 1 }))

        const nextClicked = new Set([...clicked, type])
        setClicked(nextClicked)

        // Persist to localStorage
        try {
            localStorage.setItem(storageKey, JSON.stringify([...nextClicked]))
        } catch {
            // Ignored
        }

        const apiFn = targetType === 'battle' ? reactToBattle : reactToRoast
        const result = await apiFn(roastId, type)
        setLoading(null)

        if (!result) {
            // Revert on network failure
            setCounts(c => ({ ...c, [type]: prev }))
            setClicked(s => {
                const n = new Set(s)
                n.delete(type)
                return n
            })
            try {
                const reverted = new Set(nextClicked)
                reverted.delete(type)
                localStorage.setItem(storageKey, JSON.stringify([...reverted]))
            } catch {
                // Ignored
            }
            createToast({
                type: 'error',
                message: 'Failed to record reaction. Check connection.',
                position: 'top-center',
                duration: 3000,
            })
            return
        }

        if (result.duplicate) {
            // Server already recorded this IP — revert count but keep UI disabled
            setCounts(c => ({ ...c, [type]: prev }))
            createToast({
                type: 'info',
                message: `You've already reacted to this ${targetType === 'battle' ? 'battle' : 'roast'}! 🔥`,
                position: 'top-center',
                duration: 3000,
            })
            return
        }

        // Synchronize with server counts (handles concurrent reactions)
        if (result.reactions) {
            setCounts({
                relatable: result.reactions.relatable || 0,
                destroyed: result.reactions.destroyed || 0,
                savage: result.reactions.savage || 0,
            })
        }

        const config = REACTION_CONFIG.find(r => r.type === type)
        createToast({
            type: 'success',
            message: `${config ? config.emoji + ' ' + config.label : 'Reaction'} locked in!`,
            position: 'top-center',
            duration: 2500,
        })
    }

    function formatCount(n) {
        if (!n) return '0'
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
        return n.toString()
    }

    const total = counts.relatable + counts.destroyed + counts.savage
    const hasUserReacted = clicked.size > 0
    const isFirstReaction = total === 1 && hasUserReacted && clicked.size === 1

    return (
        <div className="reactions-wrap">

            {/* ── Social Proof & First React Callout ── */}
            <div className="reactions-header">
                {total === 0 ? (
                    <div className="prompt-badge-wrap animate-pulseGlow">
                        <span className="first-react-fire">🔥</span>
                        <span className="first-react-text font-mono">
                            Be the first to react to this burn!
                        </span>
                        <span className="first-react-arrow">👇</span>
                    </div>
                ) : isFirstReaction ? (
                    <div className="prompt-badge-wrap prompt-badge--first">
                        <span className="first-react-fire">🎉</span>
                        <span className="first-react-text font-mono">
                            You were the first to react!
                        </span>
                        <span className="reactions-tag font-mono">1 reaction</span>
                    </div>
                ) : hasUserReacted ? (
                    <div className="prompt-badge-wrap prompt-badge--reacted">
                        <span className="first-react-fire">✓</span>
                        <span className="first-react-text font-mono">
                            You reacted · {total.toLocaleString()} total reaction{total === 1 ? '' : 's'}
                        </span>
                    </div>
                ) : (
                    <div className="prompt-badge-wrap prompt-badge--count">
                        <span className="reactions-total-count font-mono">
                            {total.toLocaleString()} reaction{total === 1 ? '' : 's'}
                        </span>
                        <span className="reactions-dot">•</span>
                        <span className="reactions-sub-cta font-mono">
                            How brutal was this? Tap to react 👇
                        </span>
                    </div>
                )}
            </div>

            {/* ── Emoji Action Buttons ── */}
            <div className="reactions-row">
                {REACTION_CONFIG.map(({ type, emoji, label }) => {
                    const isClicked = clicked.has(type)
                    const isLoading = loading === type
                    const isJustReacted = justReactedType === type
                    const count = counts[type] || 0

                    return (
                        <button
                            key={type}
                            type="button"
                            className={`reaction-btn font-mono ${isClicked ? 'reaction-btn--active' : ''}`}
                            onClick={() => handleReact(type)}
                            disabled={isClicked || !!loading}
                            title={isClicked ? `You reacted ${emoji} ${label} (Saved)` : `React with ${label}`}
                            aria-label={`${label} reaction: ${count} reactions`}
                        >
                            {isJustReacted && (
                                <span className="burst-plus-one font-mono">+1</span>
                            )}
                            <span
                                className="reaction-emoji"
                                style={{
                                    transform: isLoading
                                        ? 'scale(1.3)'
                                        : isJustReacted
                                            ? 'scale(1.25) rotate(-6deg)'
                                            : 'scale(1)',
                                    transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                }}
                            >
                                {emoji}
                            </span>
                            <span className="reaction-count">
                                {formatCount(count)}
                            </span>
                            {isClicked && (
                                <span className="reaction-check font-mono" title="Reacted">✓</span>
                            )}
                        </button>
                    )
                })}
            </div>

            <style jsx>{`
        .reactions-wrap {
          padding:        0.875rem 1.25rem;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            10px;
          border-top:     1px solid var(--border);
          background:     var(--bg-card);
        }

        .reactions-header {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 26px;
        }

        .prompt-badge-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(255, 107, 0, 0.08);
          border: 1px solid rgba(255, 107, 0, 0.25);
          font-size: 11px;
          color: var(--fire-warm, #ffb700);
          letter-spacing: 0.3px;
          transition: all 0.2s ease;
        }

        .animate-pulseGlow {
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.025); box-shadow: 0 0 10px rgba(255, 107, 0, 0.2); }
        }

        .prompt-badge--first {
          background: rgba(255, 69, 0, 0.12);
          border-color: rgba(255, 69, 0, 0.4);
          color: #ff6b00;
        }

        .prompt-badge--reacted {
          background: rgba(0, 230, 118, 0.08);
          border-color: rgba(0, 230, 118, 0.28);
          color: #00e676;
        }

        .prompt-badge--count {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 11px;
          padding: 0;
        }

        .reactions-tag {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-primary);
        }

        .reactions-dot {
          color: var(--text-muted);
          margin: 0 2px;
        }

        .reactions-row {
          display:         flex;
          justify-content: center;
          gap:             10px;
          width:           100%;
        }

        .reaction-btn {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            4px;
          padding:        10px 18px;
          background:     var(--bg-elevated);
          border:         1px solid var(--border);
          border-radius:  var(--radius-md);
          cursor:         pointer;
          transition:     all 0.18s ease;
          min-width:      72px;
          position:       relative;
          user-select:    none;
        }

        .reaction-btn:hover:not(:disabled) {
          border-color: var(--fire);
          background:   rgba(255, 69, 0, 0.07);
          transform:    translateY(-2px);
        }

        .reaction-btn--active {
          border-color: var(--fire);
          background:   rgba(255, 69, 0, 0.1);
          box-shadow:   0 0 12px rgba(255, 69, 0, 0.2);
          cursor:       default;
        }

        .reaction-check {
          position: absolute;
          top: 3px;
          right: 5px;
          font-size: 9px;
          color: var(--fire);
          font-weight: 700;
        }

        .burst-plus-one {
          position: absolute;
          top: -10px;
          color: var(--fire);
          font-size: 11px;
          font-weight: 700;
          animation: burstFade 0.8s ease-out forwards;
          pointer-events: none;
        }

        @keyframes burstFade {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(1.25); }
        }

        .reaction-btn:disabled {
          cursor: default;
        }

        .reaction-emoji {
          font-size: 22px;
          line-height: 1;
        }

        .reaction-count {
          font-size:  12px;
          color:      var(--text-secondary);
          min-width:  24px;
          text-align: center;
        }

        .reaction-btn--active .reaction-count {
          color: var(--fire);
          font-weight: 600;
        }

        @media (max-width: 380px) {
          .reaction-btn { padding: 8px 12px; min-width: 58px; }
          .reaction-emoji { font-size: 18px; }
          .prompt-badge-wrap { font-size: 10px; }
        }
      `}</style>
        </div>
    )
}