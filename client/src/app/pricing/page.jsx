'use client'

// ============================================================
// GITROAST — Pricing Page
// ============================================================
// WHAT: Displays all plans with outcome-focused copy.
//       Handles plan selection → payment flow → Pro unlock.
//
// WHY outcome language not feature language:
//   "Destroyed by Gemini AI — not a script" sells better than
//   "AI roast enabled" because it describes what happens TO you
//   Developers buy transformation and identity, not features
//
// WHERE: client/src/app/pricing/page.jsx
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import PaymentFlow from '@/components/PaymentFlow'
import GitHubLoginBtn from '@/components/GitHubLoginBtn'
import { useAuth } from '@/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ── Plan data (mirrors server PLANS — frontend display copy) ──
const PLANS = [
    {
        id: 'roaster',
        name: '🔥 Roaster',
        tagline: 'The Real Roast',
        displayPrice: '₹99',
        period: '/month',
        badge: 'MOST POPULAR',
        highlight: true,
        comingSoon: false,
        cta: 'Get Roasted for Real',
        ctaSubtext: 'Cancel anytime',
        features: [
            { text: 'Destroyed by Gemini AI — not a script', hot: true },
            { text: '☢️ Nuclear intensity — zero mercy', hot: true },
            { text: 'HD card download — watermark free', hot: false },
            { text: 'Private repos analyzed', hot: false },
            { text: 'Unlimited roasts per day', hot: false },
            { text: '⚡ Pro badge on your roast card', hot: false },
            { text: 'Full score history + charts', hot: false },
        ],
    },
    {
        id: 'historian',
        name: '📈 Historian',
        tagline: 'The Long Game',
        displayPrice: '₹199',
        period: '/month',
        badge: 'FOR POWER USERS',
        highlight: false,
        comingSoon: false,
        cta: 'Start Tracking My Shame',
        ctaSubtext: 'Cancel anytime',
        features: [
            { text: 'Everything in Roaster', hot: false },
            { text: 'Monthly roast report email', hot: true },
            { text: 'Score trend — improved vs last month', hot: true },
            { text: 'Roast streak tracking', hot: false },
            { text: 'Priority AI — faster responses', hot: false },
            { text: 'Exclusive Historian badge on card', hot: false },
            { text: 'Deep analytics — 6 month history', hot: false },
        ],
    },
    {
        id: 'squad',
        name: '⚔️ Squad',
        tagline: 'The Bloodbath',
        displayPrice: 'Coming Soon',
        period: '',
        badge: 'COMING SOON',
        highlight: false,
        comingSoon: true,
        cta: 'Notify Me When Live',
        ctaSubtext: 'Be first when we launch',
        features: [
            { text: 'Roast your entire engineering team', hot: true },
            { text: 'Private team leaderboard', hot: false },
            { text: 'All vs All battle mode', hot: true },
            { text: 'Team shame analytics dashboard', hot: false },
            { text: 'Custom roast branding', hot: false },
            { text: 'Weekly team roast digest email', hot: false },
        ],
    },
]

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [plansLoading, setPlansLoading] = useState(true)
    const [waitlistEmail, setWaitlistEmail] = useState('')
    const [waitlistDone, setWaitlistDone] = useState(false)
    const { user, isPro } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // WHY: simulate plans loading for skeleton UX consistency
        const t = setTimeout(() => setPlansLoading(false), 600)
        return () => clearTimeout(t)
    }, [])

    function handleSelectPlan(planId) {
        const plan = PLANS.find(p => p.id === planId)

        if (plan?.comingSoon) {
            // WHY: don't open payment for coming soon plans
            //     scroll to waitlist section instead
            document.getElementById('squad-waitlist')?.scrollIntoView({
                behavior: 'smooth'
            })
            return
        }

        if (!user) {
            createToast({
                type: 'info',
                message: '🔐 Connect GitHub first to unlock Pro.',
                position: 'top-center',
                duration: 5000,
                showCloseButton: true,
                cta: {
                    label: 'Connect GitHub',
                    onClick: () => router.push('/'),
                    autoClose: true,
                },
            })
            return
        }

        if (isPro) {
            createToast({
                type: 'success',
                message: '⚡ You already have Pro! Enjoy the nuclear roasts.',
                position: 'top-center',
                duration: 4000,
            })
            return
        }

        setSelectedPlan(planId)
    }

    function handleWaitlist(e) {
        e.preventDefault()
        if (!waitlistEmail.trim()) return
        // WHY localStorage: simple waitlist storage without backend endpoint
        //     replace with real API call when Squad launches
        const existing = JSON.parse(localStorage.getItem('squad_waitlist') || '[]')
        if (!existing.includes(waitlistEmail)) {
            existing.push(waitlistEmail)
            localStorage.setItem('squad_waitlist', JSON.stringify(existing))
        }
        setWaitlistDone(true)
        createToast({
            type: 'success',
            message: "⚔️ You're on the list! We'll notify you when Squad launches.",
            position: 'top-center',
            duration: 5000,
        })
    }

    return (
        <main className="pricing-page">

            <div className="pricing-glow" />

            {/* Nav */}
            <nav className="pricing-nav">
                <button className="btn btn-ghost" onClick={() => router.push('/')}>
                    ← Home
                </button>
                <GitHubLoginBtn variant="compact" />
            </nav>

            {/* Header */}
            <div className="pricing-header">
                <h1 className="font-display pricing-title text-fire">
                    CHOOSE YOUR DESTRUCTION
                </h1>
                <p className="font-mono pricing-sub">
                    Free gets you a taste. Pro gets you annihilated.
                </p>

                {/* WHY free tier reminder: anchors the paid plans — makes them feel cheap */}
                <div className="free-reminder font-mono">
                    ✅ Free tier always available — 1 roast/day, rule engine, watermarked card
                </div>
            </div>

            {/* Plans grid */}
            {plansLoading ? (
                <div className="plans-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="plan-skeleton" />
                    ))}
                </div>
            ) : (
                <div className="plans-grid">
                    {PLANS.map(plan => (
                        <div
                            key={plan.id}
                            className={`plan-card card ${plan.highlight ? 'plan-card--highlight' : ''} ${plan.comingSoon ? 'plan-card--soon' : ''}`}
                        >
                            {/* Badge */}
                            <div className={`plan-badge font-mono ${plan.highlight ? 'plan-badge--hot' : plan.comingSoon ? 'plan-badge--soon' : 'plan-badge--default'}`}>
                                {plan.badge}
                            </div>

                            {/* Plan header */}
                            <div className="plan-header">
                                <div>
                                    <p className="font-display plan-name">{plan.name}</p>
                                    <p className="font-mono plan-tagline">{plan.tagline}</p>
                                </div>
                                <div className="plan-price-block">
                                    {plan.comingSoon ? (
                                        <p className="font-display plan-soon-text">🔜</p>
                                    ) : (
                                        <>
                                            <div className="plan-price-row">
                                                <span className="font-display plan-currency">₹</span>
                                                <span className="font-display plan-amount">
                                                    {plan.displayPrice.replace('₹', '')}
                                                </span>
                                            </div>
                                            <p className="font-mono plan-period">{plan.period}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="plan-features">
                                {plan.features.map((f, i) => (
                                    <li key={i} className={`plan-feature font-mono ${f.hot ? 'plan-feature--hot' : ''}`}>
                                        <span className="feature-check">{f.hot ? '🔥' : '✓'}</span>
                                        <span>{f.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <div className="plan-cta">
                                {plan.comingSoon ? (
                                    // WHY anchor to waitlist: scrolls to email form below
                                    <button
                                        id="squad-waitlist-btn"
                                        className="btn btn-ghost plan-btn"
                                        onClick={() => handleSelectPlan(plan.id)}
                                    >
                                        {plan.cta}
                                    </button>
                                ) : isPro ? (
                                    <button className="btn btn-ghost plan-btn" disabled>
                                        ✓ Already Pro
                                    </button>
                                ) : (
                                    <button
                                        className={`btn plan-btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => handleSelectPlan(plan.id)}
                                    >
                                        {plan.cta}
                                    </button>
                                )}
                                <p className="font-mono plan-subtext">{plan.ctaSubtext}</p>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Squad waitlist section */}
            <div id="squad-waitlist" className="waitlist-section card">
                <p className="font-display waitlist-title text-fire">⚔️ SQUAD — Coming Soon</p>
                <p className="font-mono waitlist-sub">
                    Roast your entire engineering team. Private leaderboard. All vs All battle mode.
                    Be first to know when it launches.
                </p>
                {waitlistDone ? (
                    <p className="font-mono waitlist-done">
                        ✅ You&apos;re on the list! We&apos;ll notify you when Squad launches.
                    </p>
                ) : (
                    <form className="waitlist-form" onSubmit={handleWaitlist}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={waitlistEmail}
                            onChange={e => setWaitlistEmail(e.target.value)}
                            className="waitlist-input font-mono"
                            required
                        />
                        <button type="submit" className="btn btn-primary waitlist-btn">
                            Notify Me ⚔️
                        </button>
                    </form>
                )}
            </div>

            {/* FAQ — WHY: reduces payment anxiety, answers objections before they arise */}
            <div className="faq-section">
                <p className="font-display faq-title">FAQ</p>
                <div className="faq-grid">
                    {[
                        {
                            q: 'What counts as a "real AI roast"?',
                            a: 'Free tier uses a rule-based engine — templates + your stats. Pro uses Google Gemini 2.5 Flash with your actual GitHub data, writing a unique comedy roast every time. Not a template. Not a script.',
                        },
                        {
                            q: 'Can I cancel anytime?',
                            a: 'Yes. Cancel before your next billing date and you keep Pro until the period ends. No questions asked.',
                        },
                        {
                            q: 'What payment methods work?',
                            a: 'UPI, credit/debit cards, netbanking, and wallets. All via Razorpay — India\'s most trusted payment gateway.',
                        },
                        {
                            q: 'What\'s the difference between Roaster and Historian?',
                            a: 'Roaster gets you the full AI roast experience. Historian adds monthly automated reports — score trends, improvement tracking, roast streak. For developers who track everything.',
                        },
                    ].map((item, i) => (
                        <div key={i} className="faq-item card">
                            <p className="font-display faq-q">{item.q}</p>
                            <p className="font-mono faq-a">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment flow modal */}
            {selectedPlan && (
                <PaymentFlow
                    planId={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                />
            )}

            <style jsx>{`
        .pricing-page {
          min-height:     100vh;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          padding:        1.5rem 1rem 6rem;
          gap:            2rem;
          position:       relative;
          overflow:       hidden;
        }
        .pricing-glow {
          position:       absolute;
          inset:          0;
          background:     radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,69,0,0.12) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Nav */
        .pricing-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
          max-width:       960px;
        }

        /* Header */
        .pricing-header  { text-align: center; max-width: 640px; }
        .pricing-title   { font-size: clamp(32px, 7vw, 56px); line-height: 1; }
        .pricing-sub     { color: var(--text-secondary); font-size: 15px; margin-top: 10px; }
        .free-reminder {
          margin-top:    16px;
          font-size:     12px;
          color:         var(--text-muted);
          padding:       8px 16px;
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
        }

        /* Plans grid */
        .plans-grid {
          display:   grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap:       1.25rem;
          width:     100%;
          max-width: 960px;
        }

        /* Skeleton */
        .plan-skeleton {
          height:     480px;
          background: linear-gradient(90deg, var(--bg-card) 0%, var(--bg-elevated) 50%, var(--bg-card) 100%);
          background-size: 200%;
          animation:  shimmer 1.5s infinite;
          border-radius: var(--radius-lg);
        }

        /* Plan card */
        .plan-card {
          display:        flex;
          flex-direction: column;
          padding:        1.5rem;
          gap:            1.25rem;
          position:       relative;
          transition:     transform 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-card:hover {
          transform:  translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        /* WHY fire border on highlight: visual anchor — eye goes here first */
        .plan-card--highlight {
          border-color: var(--fire);
          box-shadow:   0 0 24px rgba(255,69,0,0.15);
        }
        .plan-card--soon { opacity: 0.75; }

        /* Badge */
        .plan-badge {
          position:      absolute;
          top:           -12px;
          left:          50%;
          transform:     translateX(-50%);
          font-size:     9px;
          padding:       3px 12px;
          border-radius: var(--radius-sm);
          letter-spacing:2px;
          white-space:   nowrap;
        }
        .plan-badge--hot {
          background: var(--fire-grad);
          color:      #fff;
        }
        .plan-badge--soon {
          background: var(--bg-elevated);
          border:     1px solid var(--border);
          color:      var(--text-muted);
        }
        .plan-badge--default {
          background: var(--bg-elevated);
          border:     1px solid var(--border);
          color:      var(--text-secondary);
        }

        /* Plan header */
        .plan-header {
          display:         flex;
          justify-content: space-between;
          align-items:     flex-start;
          margin-top:      8px;
        }
        .plan-name    { font-size: 22px; color: var(--text-primary); line-height: 1; }
        .plan-tagline { font-size: 11px; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }

        /* Price */
        .plan-price-block { text-align: right; }
        .plan-price-row   { display: flex; align-items: baseline; gap: 2px; justify-content: flex-end; }
        .plan-currency    { font-size: 18px; color: var(--fire); line-height: 1; }
        .plan-amount      { font-size: 36px; color: var(--fire); line-height: 1; }
        .plan-period      { font-size: 11px; color: var(--text-muted); }
        .plan-soon-text   { font-size: 32px; }

        /* Features */
        .plan-features {
          list-style: none;
          display:    flex;
          flex-direction: column;
          gap:        10px;
          flex:       1;
        }
        .plan-feature {
          display:     flex;
          align-items: flex-start;
          gap:         10px;
          font-size:   13px;
          color:       var(--text-secondary);
          line-height: 1.4;
        }
        /* WHY fire color for hot features: draws eye to differentiators */
        .plan-feature--hot { color: var(--text-primary); }
        .feature-check     { flex-shrink: 0; width: 16px; }

        /* CTA */
        .plan-cta   { display: flex; flex-direction: column; gap: 6px; }
        .plan-btn   { width: 100%; padding: 13px; font-size: 14px; }
        .plan-subtext { font-size: 10px; color: var(--text-muted); text-align: center; }

        /* Waitlist */
        .waitlist-section {
          width:         100%;
          max-width:     600px;
          padding:       2rem;
          text-align:    center;
          display:       flex;
          flex-direction:column;
          gap:           1rem;
          border-color:  var(--border-hover);
        }
        .waitlist-title { font-size: 28px; }
        .waitlist-sub   { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
        .waitlist-done  { font-size: 14px; color: var(--good); }
        .waitlist-form  { display: flex; gap: 10px; }
        .waitlist-input {
          flex:          1;
          padding:       12px 14px;
          background:    var(--bg-input);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          color:         var(--text-primary);
          font-size:     14px;
          outline:       none;
        }
        .waitlist-input:focus { border-color: var(--fire); }
        .waitlist-btn { padding: 12px 20px; white-space: nowrap; }

        /* FAQ */
        .faq-section { width: 100%; max-width: 960px; }
        .faq-title   { font-size: 28px; color: var(--text-primary); margin-bottom: 1rem; text-align: center; }
        .faq-grid    { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; }
        .faq-item    { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 8px; }
        .faq-q       { font-size: 15px; color: var(--text-primary); }
        .faq-a       { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

        @media (max-width: 480px) {
          .waitlist-form { flex-direction: column; }
          .faq-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </main>
    )
}