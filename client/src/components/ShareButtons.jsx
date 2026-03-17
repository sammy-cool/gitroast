'use client'

import { createToast } from 'customizable-toast-notification'
import { useState } from 'react'
import { trackShare } from '@/services/roastService'

// WHY props: parent passes username + onProClick handler
export default function ShareButtons({ username, roastId, onProClick }) {
    const [copied, setCopied] = useState(false)

    function handleShare() {
        // WHY: build the shareable URL for this roast
        const url = `${window.location.origin}/roast/${username}`

        // WHY navigator.clipboard: modern way to copy to clipboard
        navigator.clipboard.writeText(url)
            .then(() => {
                setCopied(true)

                // WHY: track share for analytics
                trackShare(roastId)

                // WHY your toast: instant feedback, on-brand
                createToast({
                    type: 'success',
                    textColor: "#ffffff",
                    message: '🔥 Roast link copied! Go share your shame.',
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 3000,
                })

                // Reset button text after 2.5s
                setTimeout(() => setCopied(false), 2500)
            })
            .catch(() => {
                createToast({
                    type: 'error',
                    textColor: "#ffffff",
                    message: 'Could not copy link. Try manually.',
                })
            })
    }

    function handlePro() {
        // WHY toast CTA: nudge user toward Pro with action button
        createToast({
            type: 'info',
            textColor: "#ffffff",
            message: '⚡ Unlock private repos + AI roast with Pro!',
            duration: 6000,
            showCloseButton: true,
            position: 'top-center',
            cta: {
                label: 'Go Pro',
                onClick: onProClick,
                autoClose: true,
            },
        })

        // Also open the modal directly
        onProClick()
    }

    return (
        <div className="share-section">

            {/* WHY watermark row: free tier always shows this */}
            <div className="watermark-row">
                <span className="font-mono watermark-url">gitroast.dev</span>
                <span className="font-mono watermark-badge">
                    FREE TIER · WATERMARKED
                </span>
            </div>

            {/* Buttons */}
            <div className="share-buttons">
                <button
                    className="btn btn-primary share-btn"
                    onClick={handleShare}
                >
                    {copied ? '✓ Copied!' : '🔥 Share Roast'}
                </button>

                <button
                    className="btn btn-outline pro-btn"
                    onClick={handlePro}
                >
                    ⚡ Go Pro — $1.99
                </button>
            </div>

            <p className="pro-hint font-mono">
                Pro: HD card · No watermark · AI roast · Private repos
            </p>

            <style jsx>{`
        .share-section {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
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
        .share-buttons {
          display: flex;
          gap:     10px;
        }
        .share-btn, .pro-btn {
          flex:          1;
          padding:       12px;
          border-radius: var(--radius-md);
          font-size:     14px;
        }
        .pro-hint {
          color:      var(--text-ghost);
          font-size:  11px;
          text-align: center;
        }
      `}</style>
        </div>
    )
}