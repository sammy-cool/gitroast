'use client'

// ============================================================
// GITROAST — Pro Modal (Upgrade Prompt)
// ============================================================
// WHAT: Shown when user hits a Pro-gated feature.
//       Renders as a true fullscreen overlay via React Portal.
//
// WHY React Portal (ReactDOM.createPortal):
//   CSS position:fixed only works relative to viewport IF no
//   ancestor has a CSS transform, filter, or perspective.
//   HydrationWrapper, layout divs, or any animated parent can
//   create a new stacking context — breaking fixed positioning.
//   Portal renders directly into document.body — completely
//   outside the React tree — so fixed always = viewport. ✅
//
// WHY loginWithGitHub directly (not router.push):
//   User clicked "Connect GitHub" — they expect OAuth to START
//   Redirecting to homepage = confusing — they're already on a page
//   Direct OAuth call = immediate action = better UX
//
// WHERE: Triggered by onProClick from RoastCard, ShareButtons,
//        intensity selector on landing page, pricing page
// ============================================================

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import PaymentFlow from './PaymentFlow'
import { useAuth } from '@/context/AuthContext'
import { createToast } from 'customizable-toast-notification'

const MODAL_PLANS = [
    {
        id: 'roaster',
        name: '🔥 Roaster',
        tagline: 'The Real Roast',
        displayPrice: '₹99',
        period: '/month',
        badge: 'MOST POPULAR',
        highlight: true,
        cta: 'Get Roasted for Real',
        bullets: [
            { text: 'Real Gemini AI — not a script', hot: true },
            { text: '☢️ Nuclear intensity unlocked', hot: true },
            { text: 'HD card — watermark free', hot: false },
            { text: 'Unlimited roasts per day', hot: false },
            { text: '⚡ Pro badge on your card', hot: false },
        ],
    },
    {
        id: 'historian',
        name: '📈 Historian',
        tagline: 'The Long Game',
        displayPrice: '₹199',
        period: '/month',
        badge: 'POWER USERS',
        highlight: false,
        cta: 'Track My Shame',
        bullets: [
            { text: 'Everything in Roaster', hot: false },
            { text: 'Monthly roast report email', hot: true },
            { text: 'Score trend tracking', hot: true },
            { text: 'Roast streak tracking', hot: false },
            { text: '🏆 Historian badge on card', hot: false },
        ],
    },
]

export default function ProModal({ onClose }) {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const { user, loginWithGitHub } = useAuth()
    const router = useRouter()

    function handlePlanSelect(planId) {
        if (!user) {
            // WHY loginWithGitHub directly:
            //   User clicked "Connect GitHub" — they want OAuth NOW
            //   router.push('/') just takes them to homepage = confusing
            //   Direct OAuth call = immediate expected action
            createToast({
                type: 'info',
                message: '🔐 Connect GitHub first to upgrade.',
                position: 'top-center',
                duration: 6000,
                showCloseButton: true,
                cta: {
                    label: 'Connect GitHub →',
                    onClick: () => {
                        onClose()
                        loginWithGitHub()   // WHY: starts OAuth directly
                    },
                    autoClose: true,
                },
            })
            return
        }
        setSelectedPlan(planId)
    }

    // WHY: if PaymentFlow is open render it instead of this modal
    if (selectedPlan) {
        return (
            <PaymentFlow
                planId={selectedPlan}
                onClose={() => {
                    setSelectedPlan(null)
                    onClose()
                }}
            />
        )
    }

    // ── Modal content ─────────────────────────────────────────
    // WHY extracted: createPortal needs the JSX as first argument
    //     cleaner to build content separately then portal it
    const modalContent = (
        <div
            className="modal-overlay"
            onClick={onClose}
            // WHY inline style for z-index:
            //   styled-jsx is scoped — z-index on overlay might not apply
            //   if the overlay isn't correctly matched by Satori scope
            //   inline style guarantees it always applies
            style={{ zIndex: 9999 }}
        >
            <div
                className="modal-box card"
                onClick={e => e.stopPropagation()}
            >

                {/* Close */}
                <button className="modal-close font-mono" onClick={onClose}>✕</button>

                {/* Header */}
                <div className="modal-header">
                    <p className="font-display modal-title text-fire">
                        UPGRADE YOUR ROAST
                    </p>
                    {/* WHY this line: ego hit — "your roast wasn't even real AI"
              Planted doubt → desire to see real AI version → convert */}
                    <p className="font-mono modal-sub">
                        Your free roast was generated by rules — not AI.
                        See what Gemini actually thinks of your GitHub.
                    </p>
                </div>

                {/* Plans */}
                <div className="modal-plans">
                    {MODAL_PLANS.map(plan => (
                        <div
                            key={plan.id}
                            className={`modal-plan ${plan.highlight ? 'modal-plan--highlight' : ''}`}
                        >
                            {/* Badge */}
                            <div className={`modal-badge font-mono ${plan.highlight ? 'modal-badge--hot' : ''}`}>
                                {plan.badge}
                            </div>

                            {/* Name + price */}
                            <div className="modal-plan-top">
                                <div>
                                    <p className="font-display modal-plan-name">{plan.name}</p>
                                    <p className="font-mono modal-plan-tagline">{plan.tagline}</p>
                                </div>
                                <div className="modal-price-block">
                                    <div className="modal-price-row">
                                        <span className="font-display modal-currency">₹</span>
                                        <span className="font-display modal-amount">
                                            {plan.displayPrice.replace('₹', '')}
                                        </span>
                                    </div>
                                    <p className="font-mono modal-period">{plan.period}</p>
                                </div>
                            </div>

                            {/* Bullets */}
                            <ul className="modal-bullets">
                                {plan.bullets.map((b, i) => (
                                    <li key={i} className={`modal-bullet font-mono ${b.hot ? 'modal-bullet--hot' : ''}`}>
                                        <span className="bullet-check">{b.hot ? '🔥' : '✓'}</span>
                                        <span>{b.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                className={`btn modal-cta ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => handlePlanSelect(plan.id)}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Compare all plans */}
                <button
                    className="btn btn-ghost modal-compare"
                    onClick={() => { onClose(); router.push('/pricing') }}
                >
                    Compare all plans →
                </button>

                {/* WHY trust signals: reduces payment anxiety
            User sees "Razorpay" → trusted name → clicks more confidently */}
                <p className="font-mono modal-trust">
                    🔒 Pay with Card · UPI · NetBanking · Wallet via Razorpay · Cancel anytime
                </p>

            </div>

            <style jsx>{`
        /* WHY position fixed + inset 0:
           covers entire viewport — nothing shows behind overlay
           backdrop-filter blur = depth — modal feels elevated above page */
        .modal-overlay {
          position:        fixed;
          inset:           0;
          background:      rgba(0, 0, 0, 0.88);
          display:         flex;
          align-items:     center;
          justify-content: center;
          padding:         1rem;
          backdrop-filter: blur(6px);
        }
        .modal-box {
          width:          100%;
          max-width:      640px;
          padding:        2rem;
          position:       relative;
          display:        flex;
          flex-direction: column;
          gap:            1.5rem;
          max-height:     90vh;
          overflow-y:     auto;
          /* WHY animate in: feels intentional, not jarring */
          animation:      fadeIn 0.2s ease forwards;
        }
        .modal-close {
          position:   absolute;
          top:        1rem;
          right:      1rem;
          background: transparent;
          border:     none;
          color:      var(--text-muted);
          cursor:     pointer;
          font-size:  16px;
          padding:    4px 8px;
          transition: color 0.15s;
          line-height:1;
        }
        .modal-close:hover { color: var(--text-primary); }

        /* Header */
        .modal-header { text-align: center; padding-top: 0.5rem; }
        .modal-title  { font-size: clamp(22px, 5vw, 34px); line-height: 1; }
        .modal-sub    {
          font-size:   13px;
          color:       var(--text-secondary);
          margin-top:  10px;
          line-height: 1.7;
        }

        /* Plans — 2 column grid */
        .modal-plans {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap:     1rem;
        }
        .modal-plan {
          padding:        1.25rem;
          background:     var(--bg-elevated);
          border:         1px solid var(--border);
          border-radius:  var(--radius-md);
          display:        flex;
          flex-direction: column;
          gap:            1rem;
          position:       relative;
          /* WHY padding-top: badge is absolutely positioned above top edge */
          padding-top:    1.5rem;
        }
        .modal-plan--highlight {
          border-color: var(--fire);
          background:   rgba(255, 69, 0, 0.04);
          box-shadow:   0 0 16px rgba(255, 69, 0, 0.1);
        }

        /* Badge */
        .modal-badge {
          position:      absolute;
          top:           -10px;
          left:          50%;
          transform:     translateX(-50%);
          font-size:     8px;
          padding:       2px 10px;
          border-radius: var(--radius-sm);
          border:        1px solid var(--border);
          color:         var(--text-muted);
          letter-spacing:1.5px;
          white-space:   nowrap;
          background:    var(--bg-card);
        }
        .modal-badge--hot {
          background: var(--fire-grad);
          color:      #fff;
          border:     none;
        }

        /* Plan top row */
        .modal-plan-top {
          display:         flex;
          justify-content: space-between;
          align-items:     flex-start;
        }
        .modal-plan-name    { font-size: 18px; color: var(--text-primary); line-height: 1; }
        .modal-plan-tagline { font-size: 10px; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }
        .modal-price-block  { text-align: right; }
        .modal-price-row    { display: flex; align-items: baseline; gap: 1px; justify-content: flex-end; }
        .modal-currency     { font-size: 14px; color: var(--fire); line-height: 1; }
        .modal-amount       { font-size: 30px; color: var(--fire); line-height: 1; }
        .modal-period       { font-size: 10px; color: var(--text-muted); }

        /* Bullets */
        .modal-bullets {
          list-style:     none;
          display:        flex;
          flex-direction: column;
          gap:            8px;
          flex:           1;
        }
        .modal-bullet {
          display:     flex;
          gap:         8px;
          font-size:   12px;
          color:       var(--text-secondary);
          line-height: 1.4;
          align-items: flex-start;
        }
        /* WHY fire color on hot bullets: draws eye to best features */
        .modal-bullet--hot { color: var(--text-primary); }
        .bullet-check      { flex-shrink: 0; width: 16px; color: var(--good); }

        .modal-cta     { width: 100%; padding: 12px; font-size: 13px; }
        .modal-compare { align-self: center; font-size: 13px; }
        .modal-trust   {
          text-align: center;
          font-size:  11px;
          color:      var(--text-muted);
          line-height:1.5;
        }

        @media (max-width: 480px) {
          .modal-plans { grid-template-columns: 1fr; }
          .modal-box   { padding: 1.5rem 1rem; }
        }
      `}</style>
        </div>
    )

    // WHY createPortal(content, document.body):
    //   Renders modalContent directly into <body>
    //   Completely bypasses any parent CSS transforms/stacking contexts
    //   position: fixed now correctly means viewport-fixed ✅
    //   This is the standard React pattern for modals/tooltips/drawers
    return createPortal(modalContent, document.body)
}