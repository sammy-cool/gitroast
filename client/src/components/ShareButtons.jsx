'use client'

import { createToast } from 'customizable-toast-notification'
import { useState } from 'react'
import { trackShare } from '@/services/roastService'

// WHY roastText prop added: enables "copy roast text" feature
//     user wants to copy the actual roast — not just the URL
export default function ShareButtons({ username, roastId, roastText, onProClick }) {
    const [copied, setCopied] = useState(false)  // link copied state
    const [copiedText, setCopiedText] = useState(false)  // text copied state

    // ── Copy link ───────────────────────────────────────────
    function handleShare() {
        const url = `${window.location.origin}/roast/${username}`

        navigator.clipboard.writeText(url)
            .then(() => {
                setCopied(true)
                trackShare(roastId)

                createToast({
                    type: 'success',
                    message: '🔥 Roast link copied! Go share your shame.',
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 3000,
                })

                setTimeout(() => setCopied(false), 2500)
            })
            .catch(() => {
                createToast({
                    type: 'error',
                    message: 'Could not copy link. Try manually.',
                    position: 'top-center',
                    duration: 5000,
                    showCloseButton: true,
                })
            })
    }

    // ── Copy roast text ─────────────────────────────────────
    // WHY: users want to paste the roast into Slack/Discord/Twitter
    //      copying just the URL doesn't give them the text
    function handleCopyText() {
        if (!roastText) return

        // WHY: clean format for sharing — username + roast + attribution
        const textToCopy = `"${roastText}" — gitroast.dev/roast/${username}`

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                setCopiedText(true)

                createToast({
                    type: 'success',
                    message: '📋 Roast text copied! Paste it anywhere.',
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 3000,
                })

                setTimeout(() => setCopiedText(false), 2500)
            })
            .catch(() => {
                createToast({
                    type: 'error',
                    message: 'Could not copy text. Try manually.',
                    position: 'top-center',
                    duration: 5000,
                    showCloseButton: true,
                })
            })
    }

    // ── Twitter/X share ─────────────────────────────────────
    // WHY: direct Tweet button = viral growth
    //      pre-filled with roast snippet → frictionless sharing
    //      opens Twitter intent URL in new tab
    function handleTwitterShare() {
        const url = `${window.location.origin}/roast/${username}`
        // WHY 120 chars: Twitter has 280 char limit
        //     leaving room for URL + hashtags
        const snippet = roastText
            ? `"${roastText.slice(0, 120)}${roastText.length > 120 ? '...' : ''}"`
            : `I just got my GitHub brutally roasted 🔥`

        const tweet = `${snippet}\n\nGet roasted at ${url} 🔥 #GitRoast #GitHub`

        // WHY encodeURIComponent: spaces and quotes must be URL-encoded
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`

        window.open(twitterUrl, '_blank', 'noopener,noreferrer')

        trackShare(roastId)

        createToast({
            type: 'success',
            message: '🐦 Twitter opened! Share your shame with the world.',
            position: 'top-center',
            duration: 3000,
        })
    }

    // ── Go Pro nudge ────────────────────────────────────────
    // WHY toast CTA only — NOT opening modal directly:
    //     soft nudge → user reads benefit → clicks if interested
    //     forced modal = aggressive = higher dismiss rate
    function handlePro() {
        createToast({
            type: 'info',
            message: '⚡ Unlock AI roasts, private repos + HD card.',
            position: 'top-center',
            duration: 6000,
            showCloseButton: true,
            showProgressBar: true,
            cta: {
                label: 'See Plans ⚡',
                onClick: onProClick,
                autoClose: true,
            },
        })
    }

    return (
        <div className="share-section">

            {/* Watermark row */}
            <div className="watermark-row">
                <span className="font-mono watermark-url">gitroast.dev</span>
                <span className="font-mono watermark-badge">
                    FREE TIER · WATERMARKED
                </span>
            </div>

            {/* Primary share buttons */}
            <div className="share-buttons">
                <button
                    className="btn btn-primary share-btn"
                    onClick={handleShare}
                >
                    {copied ? '✓ Copied!' : '🔥 Share Roast'}
                </button>

                {/* WHY X/Twitter button: biggest viral channel for developers */}
                <button
                    className="btn btn-twitter share-btn"
                    onClick={handleTwitterShare}
                    title="Share on Twitter / X"
                >
                    𝕏 Tweet This
                </button>
            </div>

            {/* Secondary actions */}
            <div className="secondary-buttons">
                {/* WHY copy text: user wants roast text not just link */}
                <button
                    className="btn btn-ghost copy-text-btn"
                    onClick={handleCopyText}
                >
                    {copiedText ? '✓ Text Copied!' : '📋 Copy Roast Text'}
                </button>

                {/* WHY ₹199: all pricing in INR */}
                <button
                    className="btn btn-outline pro-btn"
                    onClick={handlePro}
                >
                    ⚡ Go Pro — ₹199
                </button>
            </div>

            <p className="pro-hint font-mono">
                Pro: HD card · No watermark · AI roast · Private repos
            </p>

            <style jsx>{`
        .share-section {
          padding:        1.25rem 1.5rem;
          display:        flex;
          flex-direction: column;
          gap:            10px;
        }
        .watermark-row {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
        }
        .watermark-url   { color: var(--text-ghost); font-size: 11px; }
        .watermark-badge {
          background:    #111;
          border:        1px dashed #222;
          color:         #2E2E2E;
          font-size:     10px;
          padding:       2px 8px;
          border-radius: var(--radius-sm);
        }

        /* Primary row */
        .share-buttons {
          display: flex;
          gap:     8px;
        }
        .share-btn {
          flex:          1;
          padding:       12px;
          border-radius: var(--radius-md);
          font-size:     14px;
        }

        /* WHY #000 background: Twitter/X brand color */
        .btn-twitter {
          background:  #000;
          color:       #fff;
          border:      1px solid #333;
          transition:  var(--ease);
        }
        .btn-twitter:hover {
          background:  #111;
          border-color:#555;
        }

        /* Secondary row */
        .secondary-buttons {
          display: flex;
          gap:     8px;
        }
        .copy-text-btn {
          flex:      1;
          padding:   9px 12px;
          font-size: 13px;
        }
        .pro-btn {
          flex:      1;
          padding:   9px 12px;
          font-size: 13px;
        }

        .pro-hint {
          color:      var(--text-ghost);
          font-size:  11px;
          text-align: center;
        }

        /* WHY: stack all buttons vertically on very small screens */
        @media (max-width: 380px) {
          .share-buttons,
          .secondary-buttons { flex-direction: column; }
        }
      `}</style>
        </div>
    )
}