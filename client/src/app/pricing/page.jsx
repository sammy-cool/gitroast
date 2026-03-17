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
    const [mounted, setMounted] = useState(false)
    const { isLoggedIn, isPro } = useAuth()
    const router = useRouter()

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        fetch(`${API_BASE}/api/payment/plans`)
            .then(r => r.json())
            .then(d => setPlans(d.plans || []))
            .catch(() => {
                // WHY fallback: show default prices if server unreachable
                setPlans([
                    { key: 'pro_one_time', price: '₹199', label: 'Pro Lifetime' },
                    { key: 'pro_monthly', price: '₹499', label: 'Pro Monthly' },
                    { key: 'teams_monthly', price: '₹999', label: 'Teams Monthly' },
                ])
            })
    }, [])

    function handleSelectPlan(planKey) {
        if (!isLoggedIn) {
            createToast({
                type: 'info',
                textColor: "#ffffff",
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

            {/* Nav */}
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

            {/* Already Pro */}
            {mounted && isPro && (
                <div className="already-pro card">
                    <p className="font-display already-pro-title text-fire">
                        ⚡ YOU&apos;RE ALREADY PRO
                    </p>
                    <p className="font-mono already-pro-sub">
                        You have full access to all Pro features.
                    </p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>
                        🔥 Start Roasting
                    </button>
                </div>
            )}

            {/* Plan selection */}
            {mounted && !isPro && !selectedPlan && (
                <>
                    <div className="pricing-header">
                        <h1 className="font-display pricing-title text-fire">
                            UNLOCK PRO 🔥
                        </h1>
                        <p className="font-mono pricing-sub">
                            Pay with Card, UPI, NetBanking or Wallet. Unlock instantly.
                        </p>
                        {/* WHY: inform global users about INR pricing upfront */}
                        <p className="font-mono pricing-inr-note">
                            💡 Prices in Indian Rupees (INR) · Your bank auto-converts
                        </p>
                    </div>

                    {/* Pricing cards */}
                    <div className="pricing-grid">
                        {plans.map(plan => (
                            <PricingCard
                                key={plan.key}
                                planKey={plan.key}
                                price={plan.price}
                                onSelect={handleSelectPlan}
                            />
                        ))}
                    </div>

                    {/* Trust badges */}
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

                    {/* FAQ */}
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
                </>
            )}

            {/* Payment flow */}
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
        .pricing-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
        }
        .nav-logo       { font-size: 22px; }
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
        .pricing-grid {
          display:               grid;
          grid-template-columns: repeat(3, 1fr);
          gap:                   1rem;
          width:                 100%;
        }
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
        .faq          { width: 100%; padding: 1.25rem 1.5rem; }
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
        .payment-wrap { width: 100%; max-width: 520px; overflow: hidden; }
        @media (max-width: 640px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    )
}