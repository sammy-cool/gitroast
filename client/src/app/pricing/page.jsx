'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import PricingCard from '@/components/PricingCard'
import PaymentFlow from '@/components/PaymentFlow'
import GitHubLoginBtn from '@/components/GitHubLoginBtn'
import { createToast } from 'customizable-toast-notification'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [plans, setPlans] = useState([])
    const [plansLoading, setPlansLoading] = useState(true)  // WHY: tracks plan fetch state
    const [mounted, setMounted] = useState(false)
    const { isLoggedIn, isPro } = useAuth()
    const router = useRouter()

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        // WHY: fetch live prices from server
        //      server is the single source of truth for prices
        fetch(`${API_BASE}/api/payment/plans`)
            .then(r => r.json())
            .then(d => {
                setPlans(d.plans || [])
                setPlansLoading(false)  // WHY: hide skeleton once data arrives
            })
            .catch(() => {
                // WHY fallback: show default prices if server unreachable
                //     user still sees pricing — just from hardcoded values
                setPlans([
                    { key: 'pro_one_time', price: '₹199', label: 'Pro Lifetime' },
                    { key: 'pro_monthly', price: '₹499', label: 'Pro Monthly' },
                    { key: 'teams_monthly', price: '₹999', label: 'Teams Monthly' },
                ])
                setPlansLoading(false)
            })
    }, [])

    function handleSelectPlan(planKey) {
        if (!isLoggedIn) {
            createToast({
                type: 'info',
                textColor: "snow",
                message: 'Connect GitHub first to unlock Pro.',
                position: 'top-center',
                duration: 5000,
                showCloseButton: true,
            })
            return
        }
        setSelectedPlan(planKey)
    }

    function handlePaymentSuccess() {
        window.location.href = '/?upgraded=true'
    }

    const selectedPlanData = plans.find(p => p.key === selectedPlan)

    return (
        <main className="pricing-page">

            {/* ── Nav ── */}
            <div className="pricing-nav">
                <div
                    className="font-display nav-logo text-fire"
                    onClick={() => router.push('/')}
                    style={{ cursor: 'pointer' }}
                >
                    GITROAST 🔥
                </div>
                <GitHubLoginBtn variant="compact" />
            </div>

            {/* ── Already Pro ── */}
            {mounted && isPro && (
                <div className="already-pro card">
                    <p className="font-display already-pro-title text-fire">
                        ⚡ YOU&apos;RE ALREADY PRO
                    </p>
                    <p className="font-mono already-pro-sub">
                        You have full access to all Pro features.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/')}
                    >
                        🔥 Start Roasting
                    </button>
                </div>
            )}

            {/* ── Plan selection ── */}
            {mounted && !isPro && !selectedPlan && (
                <>
                    <div className="pricing-header">
                        <h1 className="font-display pricing-title text-fire">
                            UNLOCK PRO 🔥
                        </h1>
                        <p className="font-mono pricing-sub">
                            Pay with Card, UPI, NetBanking or Wallet. Unlock instantly.
                        </p>
                        <p className="font-mono pricing-inr-note">
                            💡 Prices in Indian Rupees (INR) · Your bank auto-converts
                        </p>
                    </div>

                    {/* ── Pricing grid — skeleton while loading ── */}
                    <div className="pricing-grid">
                        {plansLoading ? (
                            // WHY skeleton: prevents blank flash while plans load
                            //     3 skeletons match exact layout of 3 real cards
                            //     shimmer animation gives visual feedback of loading
                            ['pro_one_time', 'pro_monthly', 'teams_monthly'].map(key => (
                                <div key={key} className="pricing-skeleton card">
                                    <div className="skel skel-badge" />
                                    <div className="skel skel-name" />
                                    <div className="skel skel-price" />
                                    <div className="skel skel-currency" />
                                    <div className="skel-divider" />
                                    <div className="skel skel-line" />
                                    <div className="skel skel-line" />
                                    <div className="skel skel-line skel-line-short" />
                                    <div className="skel skel-line" />
                                    <div className="skel skel-line skel-line-short" />
                                    <div className="skel skel-btn" />
                                    <div className="skel skel-note" />
                                </div>
                            ))
                        ) : (
                            plans.map(plan => (
                                <PricingCard
                                    key={plan.key}
                                    planKey={plan.key}
                                    price={plan.price}
                                    onSelect={handleSelectPlan}
                                />
                            ))
                        )}
                    </div>

                    {/* ── Trust badges ── */}
                    {/* WHY: hide while loading so they don't appear before cards */}
                    {!plansLoading && (
                        <div className="trust-row">
                            {[
                                '🔒 Secured by Razorpay',
                                '🌍 Works globally',
                                '⚡ Instant unlock',
                                '📱 UPI supported',
                                '💳 All cards accepted',
                                '🏦 NetBanking',
                            ].map(badge => (
                                <span key={badge} className="trust-badge font-mono">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── FAQ ── */}
                    {/* WHY: hide while loading — no point showing FAQ before prices */}
                    {!plansLoading && (
                        <div className="faq card">
                            <p className="faq-title font-mono">FAQ</p>
                            {[
                                {
                                    q: 'How do I pay?',
                                    a: 'Click your plan → Razorpay checkout opens → pay with card, UPI, netbanking, or wallet.',
                                },
                                {
                                    q: 'How fast does Pro unlock?',
                                    a: 'Instantly after payment is verified — usually under 5 seconds.',
                                },
                                {
                                    q: 'I am in India — can I pay with UPI?',
                                    a: 'Yes — UPI, all Indian cards, netbanking, and wallets like Paytm are fully supported.',
                                },
                                {
                                    q: 'I am outside India — can I still pay?',
                                    a: 'Yes — Razorpay accepts international credit/debit cards. Prices are in INR and your bank converts automatically.',
                                },
                                {
                                    q: 'Why is pricing in INR?',
                                    a: 'GitRoast is built in India and uses Razorpay as the payment gateway. INR pricing works globally — your bank handles the conversion.',
                                },
                                {
                                    q: 'Can I get a refund?',
                                    a: 'Yes — contact us within 7 days with your payment ID. We process refunds through Razorpay.',
                                },
                            ].map(item => (
                                <div key={item.q} className="faq-item">
                                    <p className="faq-q font-mono">{item.q}</p>
                                    <p className="faq-a">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Payment flow ── */}
            {mounted && !isPro && selectedPlan && selectedPlanData && (
                <div className="payment-wrap card">
                    <PaymentFlow
                        planKey={selectedPlan}
                        price={selectedPlanData.price}
                        onSuccess={handlePaymentSuccess}
                        onCancel={() => setSelectedPlan(null)}
                    />
                </div>
            )}

            <style jsx>{`
        .pricing-page {
          min-height:     100vh;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          padding:        1.5rem 1rem 3rem;
          gap:            1.5rem;
          max-width:      860px;
          margin:         0 auto;
        }

        /* ── Nav ── */
        .pricing-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
        }
        .nav-logo { font-size: 22px; }

        /* ── Header ── */
        .pricing-header { text-align: center; }
        .pricing-title  { font-size: clamp(40px, 10vw, 64px); line-height: 1; }
        .pricing-sub {
          color:      var(--text-secondary);
          font-size:  14px;
          margin-top: 8px;
        }
        .pricing-inr-note {
          font-size:     12px;
          color:         var(--text-muted);
          margin-top:    6px;
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-sm);
          padding:       6px 14px;
          display:       inline-block;
        }

        /* ── Grid ── */
        .pricing-grid {
          display:               grid;
          grid-template-columns: repeat(3, 1fr);
          gap:                   1rem;
          width:                 100%;
        }

        /* ── Skeleton loader ── */
        /* WHY: matches exact shape of PricingCard
                user understands content is coming */
        .pricing-skeleton {
          padding:        1.5rem;
          display:        flex;
          flex-direction: column;
          gap:            0.75rem;
          position:       relative;
          overflow:       hidden;
        }
        .skel {
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 25%,
            var(--border-hover, #2E2E2E) 50%,
            var(--bg-elevated) 75%
          );
          background-size: 200% 100%;
          animation:       skelShimmer 1.5s ease-in-out infinite;
          border-radius:   var(--radius-sm);
        }
        /* WHY: each skel size matches the real element it replaces */
        .skel-badge    { height: 10px; width: 45%; align-self: flex-end; }
        .skel-name     { height: 10px; width: 55%; margin-top: 0.5rem;   }
        .skel-price    { height: 44px; width: 42%;                        }
        .skel-currency { height: 10px; width: 50%;                        }
        .skel-divider  {
          height:           1px;
          background:       var(--border);
          margin:           0.25rem 0;
          animation:        none;  /* WHY: divider is static not shimmer */
        }
        .skel-line       { height: 11px; width: 88%; }
        .skel-line-short { width: 65%;               }
        .skel-btn  {
          height:     44px;
          width:      100%;
          margin-top: 0.5rem;
          border-radius: var(--radius-md);
        }
        .skel-note { height: 10px; width: 70%; align-self: center; }

        @keyframes skelShimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Trust badges ── */
        .trust-row {
          display:         flex;
          flex-wrap:       wrap;
          gap:             10px;
          justify-content: center;
        }
        .trust-badge {
          background:    var(--bg-card);
          border:        1px solid var(--border);
          border-radius: var(--radius-sm);
          padding:       6px 12px;
          font-size:     12px;
          color:         var(--text-secondary);
        }

        /* ── FAQ ── */
        .faq { width: 100%; padding: 1.25rem 1.5rem; }
        .faq-title {
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color:          var(--text-muted);
          margin-bottom:  1rem;
        }
        .faq-item {
          padding:       0.75rem 0;
          border-bottom: 1px solid var(--border);
        }
        .faq-item:last-child { border-bottom: none; }
        .faq-q { font-size: 13px; color: var(--text-primary); margin-bottom: 4px; }
        .faq-a { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

        /* ── Already Pro ── */
        .already-pro {
          padding:        2rem;
          text-align:     center;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            1rem;
        }
        .already-pro-title { font-size: 32px; }
        .already-pro-sub   { color: var(--text-secondary); font-size: 13px; }

        /* ── Payment wrap ── */
        .payment-wrap { width: 100%; max-width: 520px; overflow: hidden; }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    )
}