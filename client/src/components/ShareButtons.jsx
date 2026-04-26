'use client'

// ============================================================
// GITROAST — ShareButtons Component
// ============================================================
// WHAT: All sharing actions for a roast card in one component.
//       Copy link, Tweet, Copy text, Download PNG card.
//
// WHY separate component:
//   RoastCard is captured as PNG — ShareButtons must be OUTSIDE
//   the capture div so buttons don't appear in the downloaded image.
//
// FREE vs PRO download difference:
//   Free → 1x scale + diagonal "ROASTED BY GITROAST" watermark
//           watermark is large, diagonal, impossible to crop cleanly
//           clear incentive to upgrade
//   Pro  → 2x HD scale + zero watermark + clean card
// ============================================================

import { createToast } from 'customizable-toast-notification'
import { useState } from 'react'
import { trackShare } from '@/services/roastService'

export default function ShareButtons({ username, roastId, roastText, isPro, onProClick }) {
    const [copied, setCopied] = useState(false)
    const [copiedText, setCopiedText] = useState(false)
    const [downloading, setDownloading] = useState(false)

    // ── Copy link ─────────────────────────────────────────────
    // WHAT: Copies shareable roast URL to clipboard
    // WHY navigator.clipboard: modern async API — works on HTTPS
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

    // ── Copy roast text ────────────────────────────────────────
    // WHAT: Copies the actual roast text (not URL) to clipboard
    // WHY: Users want to paste roast into Slack/Discord/WhatsApp
    //      Copying URL doesn't give them the text content
    function handleCopyText() {
        if (!roastText) return
        const textToCopy = `"${roastText}" — Roasted by GitRoast`
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

    // ── Twitter/X share ────────────────────────────────────────
    // WHAT: Opens Twitter with a pre-filled tweet containing roast snippet + link
    // WHY: Pre-filled = zero friction = higher share rate
    //      120 char limit leaves room for URL + hashtags within 280 char limit
    function handleTwitterShare() {
        const url = `${window.location.origin}/roast/${username}`
        const snippet = roastText
            ? `"${roastText.slice(0, 120)}${roastText.length > 120 ? '...' : ''}"`
            : `I just got my GitHub brutally roasted 🔥`
        const tweet = `${snippet}\n\nGet roasted at ${url} 🔥 #GitRoast #GitHub`
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
            '_blank', 'noopener,noreferrer'
        )
        trackShare(roastId)
        createToast({
            type: 'success',
            message: '🐦 Twitter opened! Share your shame.',
            position: 'top-center',
            duration: 3000,
        })
    }

    // ── Download PNG ───────────────────────────────────────────
    // WHAT: Captures roast card as PNG using html2canvas
    //
    // FREE tier:
    //   Scale: 1x (normal resolution)
    //   Watermark: large diagonal "ROASTED BY GITROAST" stamp
    //              drawn multiple times across card in a grid pattern
    //              semi-transparent fire color — visible but not ugly
    //              impossible to crop out cleanly = clear Pro incentive
    //
    // PRO tier:
    //   Scale: 2x (retina HD resolution)
    //   Watermark: none — completely clean card
    //
    // WHY dynamic import:
    //   html2canvas is ~200KB — only load when user actually clicks download
    //   not on page load — keeps initial bundle fast
    async function handleDownload() {
        setDownloading(true)

        try {
            const html2canvas = (await import('html2canvas')).default

            const element = document.getElementById('roast-card-capture')
            if (!element) throw new Error('Card element not found')

            // WHY scale difference:
            //   Pro = 2x = retina quality — crisp on all screens including Retina Mac
            //   Free = 1x = standard quality — usable but noticeably less sharp
            const scale = isPro ? 2 : 1

            const canvas = await html2canvas(element, {
                scale,
                useCORS: true,
                backgroundColor: '#0F0F0F',
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            })

            // ── Watermark for free users ──────────────────────────
            // WHAT: Draws diagonal "ROASTED BY GITROAST" repeatedly across card
            // WHY diagonal: harder to crop out than bottom bar
            //               covers the entire card — no clean region to screenshot
            // WHY repeat: single watermark in corner = easy to crop
            //             grid of watermarks = impossible to remove cleanly
            if (!isPro) {
                const ctx = canvas.getContext('2d')

                // WHY save/restore: canvas transform (rotate) is stateful
                //     save() records current state, restore() resets after drawing
                //     without this, rotation accumulates and breaks subsequent draws
                ctx.save()

                // WHY globalAlpha 0.18:
                //   Low enough that card content is still readable (UX)
                //   High enough that watermark is clearly visible (incentive)
                //   Too high (0.5+) = card looks ruined = bad UX
                //   Too low (0.05) = invisible = no incentive
                ctx.globalAlpha = 0.18

                // WHY fire orange (#FF6B00):
                //   Matches GitRoast brand — not a generic grey watermark
                //   Stands out on dark background without being garish
                ctx.fillStyle = '#FF6B00'

                // WHY font size 38:
                //   Large enough to be unmissable
                //   Small enough that multiple copies fit across the card
                ctx.font = 'bold 38px "Courier New", monospace'
                ctx.textAlign = 'center'

                // WHY -30deg rotation:
                //   Standard diagonal watermark angle
                //   Feels intentional, not accidental
                //   Same direction used by Adobe, Canva, etc.
                const angle = -Math.PI / 6

                // WHAT: Draw watermark in a grid across entire canvas
                // WHY step 260x180: spacing that ensures full coverage
                //     at any canvas size — tested at 1x and 2x
                const stepX = 260
                const stepY = 180
                const text = 'ROASTED BY GITROAST'

                for (let y = -100; y < canvas.height + 100; y += stepY) {
                    for (let x = -100; x < canvas.width + 100; x += stepX) {
                        ctx.save()
                        ctx.translate(x, y)
                        ctx.rotate(angle)
                        ctx.fillText(text, 0, 0)
                        ctx.restore()
                    }
                }

                ctx.restore()
            }

            // ── Trigger download ──────────────────────────────────
            // WHY hidden anchor click:
            //   Most reliable cross-browser download trigger
            //   programmatic download via fetch/blob has Safari issues
            //   <a download> is universally supported
            const link = document.createElement('a')
            link.download = `gitroast-${username}.png`
            link.href = canvas.toDataURL('image/png', 1.0)
            link.click()

            createToast({
                type: 'success',
                message: isPro
                    ? '⚡ HD roast card downloaded! No watermark, full quality.'
                    : '🔥 Card downloaded! Go Pro to remove the watermark.',
                position: 'top-center',
                showProgressBar: true,
                duration: 4000,
            })

            trackShare(roastId)

        } catch (err) {
            console.error('[Download] Failed:', err)
            createToast({
                type: 'error',
                message: 'Download failed. Try again.',
                position: 'top-center',
                duration: 4000,
                showCloseButton: true,
            })
        } finally {
            setDownloading(false)
        }
    }

    // ── Pro nudge ──────────────────────────────────────────────
    // WHAT: Soft upgrade prompt via toast with CTA
    // WHY toast not modal: non-blocking — user reads benefit then decides
    //     forced modal = aggressive = higher dismiss rate
    //     toast CTA = explicit intent = better conversion
    function handlePro() {
        createToast({
            type: 'info',
            message: '⚡ Unlock AI roasts, private repos + HD watermark-free card.',
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

            {/* Watermark badge row */}
            <div className="watermark-row">
                <span className="font-mono watermark-url">gitroast</span>
                <span className={`font-mono watermark-badge ${isPro ? 'watermark-badge--pro' : ''}`}>
                    {isPro ? 'PRO ⚡ · HD · NO WATERMARK' : 'FREE · WATERMARKED'}
                </span>
            </div>

            {/* Primary row — share + tweet */}
            <div className="share-buttons">
                <button
                    className="btn btn-primary share-btn"
                    onClick={handleShare}
                >
                    {copied ? '✓ Copied!' : '🔥 Share Roast'}
                </button>
                <button
                    className="btn btn-twitter share-btn"
                    onClick={handleTwitterShare}
                    title="Share on Twitter / X"
                >
                    𝕏 Tweet This
                </button>
            </div>

            {/* Download — full width, most prominent */}
            <div className="secondary-buttons">
                <button
                    className={`btn download-btn ${isPro ? 'download-btn--pro' : 'download-btn--free'}`}
                    onClick={handleDownload}
                    disabled={downloading}
                    title={isPro ? 'Download HD card — no watermark' : 'Download card — watermarked'}
                >
                    {downloading
                        ? '⏳ Generating...'
                        : isPro
                            ? '⬇️ Download HD Card — No Watermark'
                            : '⬇️ Download Card (Watermarked)'}
                </button>
            </div>

            {/* Tertiary — copy text + go pro */}
            <div className="tertiary-buttons">
                <button className="btn btn-ghost copy-text-btn" onClick={handleCopyText}>
                    {copiedText ? '✓ Copied!' : '📋 Copy Roast Text'}
                </button>
                {!isPro && (
                    <button className="btn btn-outline pro-btn" onClick={handlePro}>
                        ⚡ Go Pro — ₹199
                    </button>
                )}
            </div>

            {/* WHY: show clear value prop below download button for free users */}
            {!isPro && (
                <p className="pro-hint font-mono">
                    ⚡ Pro = HD card · No watermark · AI roast · Nuclear mode · Private repos
                </p>
            )}

            <style jsx>{`
        .share-section {
          padding:        1.25rem 1.5rem;
          display:        flex;
          flex-direction: column;
          gap:            10px;
        }

        /* Watermark row */
        .watermark-row {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
        }
        .watermark-url   { color: var(--text-ghost); font-size: 11px; }
        .watermark-badge {
          font-size:     10px;
          padding:       2px 8px;
          border-radius: var(--radius-sm);
          background:    #111;
          border:        1px dashed #222;
          color:         #3A3A3A;
          letter-spacing:1px;
        }
        /* WHY different style for Pro badge: reward the upgrade visually */
        .watermark-badge--pro {
          border-color: rgba(255, 69, 0, 0.4);
          color:        var(--fire);
          background:   rgba(255, 69, 0, 0.08);
          border-style: solid;
        }

        /* Primary row */
        .share-buttons { display: flex; gap: 8px; }
        .share-btn {
          flex:          1;
          padding:       12px;
          border-radius: var(--radius-md);
          font-size:     14px;
        }

        /* WHY black: Twitter/X brand color */
        .btn-twitter {
          background:  #000;
          color:       #fff;
          border:      1px solid #333;
          transition:  var(--ease);
        }
        .btn-twitter:hover { background: #111; border-color: #555; }

        /* Download — full width, most prominent button */
        .secondary-buttons { display: flex; }
        .download-btn {
          width:          100%;
          padding:        13px;
          border-radius:  var(--radius-md);
          font-size:      14px;
          font-weight:    700;
          transition:     var(--ease);
          letter-spacing: 0.2px;
        }

        /* WHY muted style for free download:
           makes it clear it's not the premium version
           user understands they're getting the watermarked version */
        .download-btn--free {
          background:  var(--bg-elevated);
          color:       var(--text-secondary);
          border:      1px solid var(--border-hover);
        }
        .download-btn--free:hover:not(:disabled) {
          border-color: rgba(255, 69, 0, 0.4);
          color:        var(--text-primary);
        }

        /* WHY fire gradient for Pro download:
           premium feel, visually distinct, feels earned */
        .download-btn--pro {
          background:  var(--fire-grad);
          color:       #fff;
          border:      none;
          box-shadow:  0 4px 20px rgba(255, 69, 0, 0.25);
        }
        .download-btn--pro:hover:not(:disabled) {
          opacity:    0.92;
          transform:  translateY(-1px);
          box-shadow: 0 6px 28px rgba(255, 69, 0, 0.4);
        }
        .download-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Tertiary row */
        .tertiary-buttons { display: flex; gap: 8px; }
        .copy-text-btn { flex: 1; padding: 9px 12px; font-size: 13px; }
        .pro-btn       { flex: 1; padding: 9px 12px; font-size: 13px; }

        .pro-hint {
          color:      var(--text-muted);
          font-size:  11px;
          text-align: center;
          line-height: 1.6;
        }

        @media (max-width: 380px) {
          .share-buttons,
          .tertiary-buttons { flex-direction: column; }
        }
      `}</style>
        </div>
    )
}