'use client'

// ============================================================
// GITROAST — ProModal
// ============================================================
// WHAT: Upgrade prompt modal — shows plan selection OR payment
//       flow inside the same overlay. ONE render path always.
//
// WHY single render path:
//   Industry standard (Stripe, GitHub, Linear):
//   overlay never unmounts — content transitions inside it
//   Two render paths = styled-jsx loses scope on PATH 2
//   = overlay CSS never injects = PaymentFlow renders inline
//
// WHY createPortal:
//   Renders directly into document.body
//   Bypasses any parent CSS transform/stacking context
//   position:fixed always = true viewport fixed
//
// WHY scroll lock on mount:
//   Without it — page behind modal scrolls on mobile
//   Locked on open, restored on close/unmount
// ============================================================

import { useState, useEffect } from 'react'
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

    // WHY scroll lock:
    //   Locks body scroll when modal opens
    //   Restores on unmount (close/navigate away)
    //   Without this: page scrolls behind modal on mobile
    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [])

    function handlePlanSelect(planId) {
        if (!user) {
            createToast({
                type: 'info',
                message: '🔐 Connect GitHub first to upgrade.',
                position: 'top-center',
                duration: 6000,
                showCloseButton: true,
                cta: {
                    label: 'Connect GitHub →',
                    onClick: () => { onClose(); loginWithGitHub() },
                    autoClose: true,
                },
            })
            return
        }
        setSelectedPlan(planId)
    }

    // WHY single portal return — never split into two paths:
    //   <style jsx> only injects when THIS component renders its JSX
    //   If we return early (if selectedPlan return <PaymentFlow/>)
    //   the styled-jsx block never runs → .modal-overlay has no CSS
    //   → overlay is invisible → PaymentFlow appears inline on page
    //
    //   Solution: ONE createPortal call, content switches inside modal-box
    //   Overlay + modal-box ALWAYS render
    //   Inside: conditionally show plan list OR PaymentFlow
    return createPortal(
        <div className="modal-overlay" onClick={!selectedPlan ? onClose : undefined}>
            <div
                className="modal-box card"
                onClick={e => e.stopPropagation()}
            >

                {/* WHY conditional content — not conditional return:
            overlay stays mounted, only inner content changes
            smooth UX — backdrop never flickers */}

                {selectedPlan ? (
                    // ── Payment flow inside modal ─────────────────────
                    // WHY back button instead of close:
                    //   User selected plan — don't close entire modal
                    //   Let them go back to plan selection if they change mind
                    <>
                        <button
                            className="modal-back font-mono"
                            onClick={() => setSelectedPlan(null)}
                        >
                            ← Back to plans
                        </button>
                        <PaymentFlow
                            planId={selectedPlan}
                            onClose={() => { setSelectedPlan(null); onClose() }}
                        />
                    </>
                ) : (
                    // ── Plan selection ────────────────────────────────
                    <>
                        <button
                            className="modal-close font-mono"
                            onClick={onClose}
                        >
                            ✕
                        </button>

                        <div className="modal-header">
                            <p className="font-display modal-title text-fire">
                                UPGRADE YOUR ROAST
                            </p>
                            <p className="font-mono modal-sub">
                                Your free roast was generated by rules — not AI.
                                See what Gemini actually thinks of your GitHub.
                            </p>
                        </div>

                        <div className="modal-plans">
                            {MODAL_PLANS.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`modal-plan ${plan.highlight ? 'modal-plan--highlight' : ''}`}
                                >
                                    <div className={`modal-badge font-mono ${plan.highlight ? 'modal-badge--hot' : ''}`}>
                                        {plan.badge}
                                    </div>

                                    <div className="modal-plan-top">
                                        <div className="modal-plan-info">
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

                                    <ul className="modal-bullets">
                                        {plan.bullets.map((b, i) => (
                                            <li
                                                key={i}
                                                className={`modal-bullet font-mono ${b.hot ? 'modal-bullet--hot' : ''}`}
                                            >
                                                <span className="bullet-icon">{b.hot ? '🔥' : '✓'}</span>
                                                <span>{b.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`btn modal-cta ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => handlePlanSelect(plan.id)}
                                    >
                                        {plan.cta}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-ghost modal-compare"
                            onClick={() => { onClose(); router.push('/pricing') }}
                        >
                            Compare all plans →
                        </button>

                        <p className="font-mono modal-trust">
                            🔒 Pay with Card · UPI · NetBanking · Wallet via Razorpay · Cancel anytime
                        </p>
                    </>
                )}

            </div>

            <style jsx>{`
        .modal-overlay {
          position:        fixed;
          inset:           0;
          background:      rgba(0, 0, 0, 0.88);
          display:         flex;
          align-items:     center;
          justify-content: center;
          padding:         1rem;
          backdrop-filter: blur(6px);
          z-index:         9999;
          overflow-y:      auto;
        }
        .modal-box {
          width:          100%;
          max-width:      640px;
          padding:        2rem;
          position:       relative;
          display:        flex;
          flex-direction: column;
          gap:            1.5rem;
          max-height:     90dvh;
          overflow-y:     auto;
          animation:      fadeIn 0.2s ease forwards;
          margin:         auto;
        }

        /* Close + Back buttons */
        .modal-close {
          position:   absolute;
          top:        1rem;
          right:      1rem;
          background: transparent;
          border:     none;
          color:      var(--text-muted);
          cursor:     pointer;
          font-size:  18px;
          padding:    4px 8px;
          line-height:1;
          z-index:    1;
          transition: color 0.15s;
        }
        .modal-close:hover { color: var(--text-primary); }
        .modal-back {
          background:  transparent;
          border:      none;
          color:       var(--text-secondary);
          cursor:      pointer;
          font-size:   12px;
          padding:     0;
          text-align:  left;
          transition:  color 0.15s;
        }
        .modal-back:hover { color: var(--text-primary); }

        /* Header */
        .modal-header  { text-align: center; padding-top: 0.25rem; }
        .modal-title   { font-size: clamp(22px, 5vw, 34px); line-height: 1; }
        .modal-sub {
          font-size:   13px;
          color:       var(--text-secondary);
          margin-top:  10px;
          line-height: 1.7;
        }

        /* Plans grid */
        .modal-plans {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap:     1rem;
          overflow:visible; /* WHY: badges use negative top — need overflow visible */
        }
        .modal-plan {
          padding:        1.25rem;
          padding-top:    1.75rem;
          background:     var(--bg-elevated);
          border:         1px solid var(--border);
          border-radius:  var(--radius-md);
          display:        flex;
          flex-direction: column;
          gap:            1rem;
          position:       relative;
          overflow:       visible; /* WHY: badge overflows top — must be visible */
        }
        .modal-plan--highlight {
          border-color: var(--fire);
          background:   rgba(255, 69, 0, 0.04);
          box-shadow:   0 0 16px rgba(255, 69, 0, 0.1);
        }

        /* Badge — sits above card top edge */
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
          gap:             8px;
        }
        .modal-plan-info    { min-width: 0; }
        .modal-plan-name    { font-size: 18px; color: var(--text-primary); line-height: 1; }
        .modal-plan-tagline { font-size: 10px; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }
        .modal-price-block  { text-align: right; flex-shrink: 0; }
        .modal-price-row    { display: flex; align-items: baseline; justify-content: flex-end; gap: 1px; }
        .modal-currency     { font-size: 14px; color: var(--fire); line-height: 1; }
        .modal-amount       { font-size: 28px; color: var(--fire); line-height: 1; }
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
        .modal-bullet--hot { color: var(--text-primary); }
        .bullet-icon       { flex-shrink: 0; width: 16px; }

        .modal-cta     { width: 100%; padding: 12px; font-size: 13px; }
        .modal-compare { align-self: center; font-size: 13px; }
        .modal-trust {
          text-align:  center;
          font-size:   11px;
          color:       var(--text-muted);
          line-height: 1.8;
        }

        /* Responsive */
        @media (max-width: 560px) {
          .modal-plans { grid-template-columns: 1fr; }
          .modal-box   { padding: 1.5rem 1rem; gap: 1.25rem; }
        }
        @media (max-width: 380px) {
          .modal-box    { padding: 1.25rem 0.875rem; }
          .modal-plan   { padding: 1rem; padding-top: 1.5rem; }
          .modal-amount { font-size: 24px; }
        }
      `}</style>
        </div>,
        document.body
    )
}