'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import GitHubLoginBtn from './GitHubLoginBtn'

const FREE_FEATURES = [
    '1 roast per day',
    'Public repos only',
    'Watermarked card',
    'Basic rule-based roast',
]

const PRO_FEATURES = [
    'Unlimited roasts',
    'Public + Private repos',
    'HD card — no watermark',
    'AI-powered roast',
    'Monthly progress comparison',
    'Shareable link forever',
    'Team leaderboard',
]

export default function ProModal({ onClose }) {
    const { isLoggedIn } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    // WHY: prevent page scrolling behind modal
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // WHY: click outside modal = close
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-box card animate-fadeUp">

                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="font-display modal-title text-fire">⚡ Go Pro</h2>
                        <p className="modal-subtitle">Unlock the full roast experience</p>
                    </div>
                    <button
                        className="btn btn-ghost modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Free vs Pro comparison */}
                <div className="modal-grid">

                    {/* Free column */}
                    <div className="modal-col">
                        <p className="col-label font-mono">FREE</p>
                        <ul className="feature-list">
                            {FREE_FEATURES.map(f => (
                                <li key={f} className="feature-item feature-bad">
                                    <span className="feature-icon">✗</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro column */}
                    <div className="modal-col modal-col-pro">
                        <p className="col-label font-mono col-label-pro">PRO ⚡</p>
                        <ul className="feature-list">
                            {PRO_FEATURES.map(f => (
                                <li key={f} className="feature-item feature-good">
                                    <span className="feature-icon">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Private repo highlight */}
                <div className="private-repo-note font-mono">
                    🔐 Private repos require GitHub login — we only read, never write.
                    Your code stays yours.
                </div>

                {/* Pricing — INR */}
                <div className="modal-pricing">
                    <div className="price-option">
                        {/* WHY: ₹ symbol smaller, number bigger — standard pricing UI */}
                        <div className="price-amount-row">
                            <span className="font-display price-symbol" style={{ color: 'var(--fire)' }}>
                                ₹
                            </span>
                            <span className="font-display price-number" style={{ color: 'var(--fire)' }}>
                                199
                            </span>
                        </div>
                        <span className="price-label font-mono">one time</span>
                    </div>

                    <div className="price-divider font-mono">or</div>

                    <div className="price-option">
                        <div className="price-amount-row">
                            <span className="font-display price-symbol" style={{ color: 'var(--fire-warm)' }}>
                                ₹
                            </span>
                            <span className="font-display price-number" style={{ color: 'var(--fire-warm)' }}>
                                499
                            </span>
                        </div>
                        <span className="price-label font-mono">/month · teams</span>
                    </div>
                </div>

                {/* INR note for global users */}
                <p className="inr-note font-mono">
                    💡 Prices in INR · Your bank auto-converts to your local currency
                </p>

                {/* CTA */}
                {mounted && (
                    isLoggedIn ? (
                        <button
                            className="btn btn-primary modal-cta"
                            onClick={() => { onClose(); router.push('/pricing') }}
                        >
                            ⚡ See Pricing → Unlock Pro
                        </button>
                    ) : (
                        <GitHubLoginBtn variant="full" />
                    )
                )}

                <p className="modal-disclaimer font-mono">
                    Pay with Card · UPI · NetBanking · Wallet via Razorpay
                </p>
            </div>

            <style jsx>{`
        .modal-backdrop {
          position:        fixed;
          inset:           0;
          background:      rgba(0, 0, 0, 0.85);
          display:         flex;
          align-items:     center;
          justify-content: center;
          padding:         1rem;
          z-index:         1000;
          backdrop-filter: blur(4px);
        }
        .modal-box {
          width:          100%;
          max-width:      540px;
          max-height:     90vh;
          overflow-y:     auto;
          padding:        1.75rem;
          display:        flex;
          flex-direction: column;
          gap:            1.25rem;
        }
        .modal-header {
          display:         flex;
          justify-content: space-between;
          align-items:     flex-start;
        }
        .modal-title    { font-size: 36px; line-height: 1; }
        .modal-subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
        .modal-close    { padding: 6px 10px; }
        .modal-grid {
          display:               grid;
          grid-template-columns: 1fr 1fr;
          gap:                   1rem;
        }
        .modal-col {
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          padding:       1rem;
        }
        .modal-col-pro {
          border-color: var(--fire);
          background:   rgba(255, 69, 0, 0.04);
        }
        .col-label {
          font-size:      10px;
          letter-spacing: 2px;
          color:          var(--text-muted);
          margin-bottom:  10px;
          text-transform: uppercase;
        }
        .col-label-pro { color: var(--fire); }
        .feature-list  { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .feature-item  { font-size: 13px; display: flex; gap: 8px; line-height: 1.4; }
        .feature-bad   { color: var(--text-secondary); }
        .feature-good  { color: var(--text-primary); }
        .feature-icon  { flex-shrink: 0; font-size: 12px; margin-top: 1px; }
        .private-repo-note {
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-left:   3px solid var(--fire-warm);
          border-radius: var(--radius-sm);
          padding:       10px 14px;
          font-size:     12px;
          color:         var(--text-secondary);
          line-height:   1.6;
        }
        /* Pricing row */
        .modal-pricing {
          display:         flex;
          align-items:     center;
          justify-content: center;
          gap:             1.5rem;
        }
        .price-option     { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .price-amount-row { display: flex; align-items: baseline; gap: 1px; }
        /* WHY: symbol smaller than number — standard pricing pattern */
        .price-symbol     { font-size: 20px; line-height: 1; }
        .price-number     { font-size: 36px; line-height: 1; }
        .price-label      { font-size: 11px; color: var(--text-secondary); }
        .price-divider    { color: var(--text-muted); font-size: 13px; }
        /* INR note */
        .inr-note {
          text-align:    center;
          font-size:     11px;
          color:         var(--text-muted);
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-sm);
          padding:       6px 12px;
        }
        /* CTA */
        .modal-cta {
          width:          100%;
          padding:        14px;
          font-size:      15px;
          border-radius:  var(--radius-md);
          letter-spacing: 0.5px;
        }
        .modal-disclaimer {
          text-align: center;
          color:      var(--text-ghost);
          font-size:  11px;
        }
        @media (max-width: 480px) {
          .modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    )
}