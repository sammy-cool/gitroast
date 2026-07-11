'use client'

// ============================================================
// GITROAST — Pricing Page
// ============================================================
// WHAT: Displays all 3 plans with outcome-focused copy.
//       Fully responsive across mobile, tablet, desktop.
//
// RESPONSIVE STRATEGY:
//   Mobile  (<480px): 1 column, stacked layout
//   Tablet  (480-768px): 2 col plans + Squad below
//   Desktop (>768px): 3 col plans side by side
//
// WHERE: client/src/app/pricing/page.jsx
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import PaymentModal from '@/components/PaymentModal'
import GitHubLoginBtn from '@/components/GitHubLoginBtn'
import { useAuth } from '@/context/AuthContext'

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
            { text: 'Real Gemini AI — not a script', hot: true },
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
        badge: 'POWER USERS',
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

const FAQ = [
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
        a: "UPI, credit/debit cards, netbanking, and wallets. All via Razorpay — India's most trusted payment gateway.",
    },
    {
        q: 'Roaster vs Historian — what\'s different?',
        a: 'Roaster gets you the full AI roast experience. Historian adds monthly automated reports — score trends, improvement tracking, roast streak. For developers who track everything.',
    },
]

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [plansLoading, setPlansLoading] = useState(true)
    const [waitlistEmail, setWaitlistEmail] = useState('')
    const [waitlistDone, setWaitlistDone] = useState(false)
    const { user, isPro, loginWithGitHub } = useAuth()
    const router = useRouter()

    useEffect(() => {
        const t = setTimeout(() => setPlansLoading(false), 600)
        return () => clearTimeout(t)
    }, [])

    function handleSelectPlan(planId) {
        const plan = PLANS.find(p => p.id === planId)
        if (plan?.comingSoon) {
            document.getElementById('squad-waitlist')?.scrollIntoView({ behavior: 'smooth' })
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
                    label: 'Connect GitHub →',
                    onClick: () => loginWithGitHub(),
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
                <div className="free-reminder font-mono">
                    ✅ Free tier always available — 1 roast/day · Rule engine · Watermarked card
                </div>
            </div>

            {/* Plans */}
            {plansLoading ? (
                <div className="plans-grid">
                    {[1, 2, 3].map(i => <div key={i} className="plan-skeleton" />)}
                </div>
            ) : (
                <div className="plans-grid">
                    {PLANS.map(plan => (
                        <div
                            key={plan.id}
                            className={`plan-card card ${plan.highlight ? 'plan-card--highlight' : ''} ${plan.comingSoon ? 'plan-card--soon' : ''}`}
                        >
                            {/* Badge */}
                            <div className={`plan-badge font-mono ${plan.highlight ? 'plan-badge--hot' :
                                plan.comingSoon ? 'plan-badge--soon' :
                                    'plan-badge--default'
                                }`}>
                                {plan.badge}
                            </div>

                            {/* Header */}
                            <div className="plan-header">
                                <div className="plan-info">
                                    <p className="font-display plan-name">{plan.name}</p>
                                    <p className="font-mono plan-tagline">{plan.tagline}</p>
                                </div>
                                <div className="plan-price-block">
                                    {plan.comingSoon ? (
                                        <p className="plan-soon-emoji">🔜</p>
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
                                        <span className="feature-icon">{f.hot ? '🔥' : '✓'}</span>
                                        <span>{f.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <div className="plan-cta">
                                <button
                                    className={`btn plan-btn ${plan.comingSoon ? 'btn-ghost' :
                                        isPro ? 'btn-ghost' :
                                            plan.highlight ? 'btn-primary' :
                                                'btn-outline'
                                        }`}
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={isPro && !plan.comingSoon}
                                >
                                    {isPro && !plan.comingSoon ? '✓ Already Pro' : plan.cta}
                                </button>
                                <p className="font-mono plan-subtext">{plan.ctaSubtext}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Squad waitlist */}
            <div id="squad-waitlist" className="waitlist-section card">
                <div className="waitlist-content">
                    <p className="font-display waitlist-title text-fire">⚔️ SQUAD — Coming Soon</p>
                    <p className="font-mono waitlist-sub">
                        Roast your entire engineering team. Private leaderboard. All vs All battle mode.
                    </p>
                </div>
                {waitlistDone ? (
                    <p className="font-mono waitlist-done">
                        ✅ You&apos;re on the list! We&apos;ll notify you when Squad launches.
                    </p>
                ) : (
                    <div className="waitlist-form">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={waitlistEmail}
                            onChange={e => setWaitlistEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleWaitlist(e)}
                            className="waitlist-input font-mono"
                        />
                        <button
                            className="btn btn-primary waitlist-btn"
                            onClick={handleWaitlist}
                        >
                            Notify Me ⚔️
                        </button>
                    </div>
                )}
            </div>

            {/* FAQ */}
            <div className="faq-section">
                <p className="font-display faq-title">FAQ</p>
                <div className="faq-grid">
                    {FAQ.map((item, i) => (
                        <div key={i} className="faq-item card">
                            <p className="font-display faq-q">{item.q}</p>
                            <p className="font-mono faq-a">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* WHY PaymentModal: handles its own portal + overlay
          renders centered on screen regardless of page scroll position */}
            {selectedPlan && (
                <PaymentModal
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
        .pricing-header {
          text-align: center;
          width:      100%;
          max-width:  640px;
          display:    flex;
          flex-direction: column;
          align-items: center;
          gap:        12px;
        }
        .pricing-title { font-size: clamp(28px, 7vw, 56px); line-height: 1.05; }
        .pricing-sub   { color: var(--text-secondary); font-size: 15px; }
        .free-reminder {
          font-size:     12px;
          color:         var(--text-muted);
          padding:       8px 16px;
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          text-align:    center;
          line-height:   1.6;
        }

        /* Plans grid
           Desktop (>768px):  3 columns
           Tablet (480-768px): 2 columns + Squad below (via grid area)
           Mobile (<480px):   1 column stack */
        .plans-grid {
          display:   grid;
          gap:       1.25rem;
          width:     100%;
          max-width: 960px;
          /* WHY 300px min: ensures readable card width */
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          /* WHY align-items start: cards can have different heights */
          align-items: start;
        }

        /* Skeleton */
        .plan-skeleton {
          height:        480px;
          border-radius: var(--radius-lg);
          background:    linear-gradient(90deg, var(--bg-card) 0%, var(--bg-elevated) 50%, var(--bg-card) 100%);
          background-size: 200%;
          animation:     shimmer 1.5s infinite;
        }

        /* Plan card */
        .plan-card {
          display:        flex;
          flex-direction: column;
          padding:        1.5rem;
          padding-top:    2rem; /* WHY: space for absolute badge */
          gap:            1.25rem;
          position:       relative;
          transition:     transform 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-card:hover:not(.plan-card--soon) {
          transform:  translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .plan-card--highlight {
          border-color: var(--fire);
          box-shadow:   0 0 24px rgba(255,69,0,0.15);
        }
        .plan-card--soon { opacity: 0.7; }

        /* Badge */
        .plan-badge {
          position:      absolute;
          top:           -11px;
          left:          50%;
          transform:     translateX(-50%);
          font-size:     9px;
          padding:       3px 12px;
          border-radius: var(--radius-sm);
          letter-spacing:1.5px;
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
          gap:             8px;
        }
        .plan-info      { min-width: 0; }
        .plan-name      { font-size: 20px; color: var(--text-primary); line-height: 1; }
        .plan-tagline   { font-size: 11px; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }

        /* Price */
        .plan-price-block { text-align: right; flex-shrink: 0; }
        .plan-price-row   { display: flex; align-items: baseline; justify-content: flex-end; gap: 2px; }
        .plan-currency    { font-size: 16px; color: var(--fire); line-height: 1; }
        .plan-amount      { font-size: 34px; color: var(--fire); line-height: 1; }
        .plan-period      { font-size: 11px; color: var(--text-muted); }
        .plan-soon-emoji  { font-size: 28px; }

        /* Features */
        .plan-features {
          list-style:     none;
          display:        flex;
          flex-direction: column;
          gap:            10px;
          flex:           1;
        }
        .plan-feature {
          display:     flex;
          gap:         10px;
          font-size:   13px;
          color:       var(--text-secondary);
          line-height: 1.4;
          align-items: flex-start;
        }
        .plan-feature--hot { color: var(--text-primary); font-weight: 500; }
        .feature-icon      { flex-shrink: 0; width: 18px; }

        /* CTA */
        .plan-cta     { display: flex; flex-direction: column; gap: 6px; }
        .plan-btn     { width: 100%; padding: 13px; font-size: 14px; }
        .plan-subtext { font-size: 10px; color: var(--text-muted); text-align: center; }

        /* Waitlist */
        .waitlist-section {
          width:          100%;
          max-width:      640px;
          padding:        1.75rem;
          display:        flex;
          flex-direction: column;
          gap:            1.25rem;
          align-items:    center;
          text-align:     center;
        }
        .waitlist-content { display: flex; flex-direction: column; gap: 8px; }
        .waitlist-title   { font-size: clamp(20px, 5vw, 28px); }
        .waitlist-sub     { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
        .waitlist-done    { font-size: 14px; color: var(--good); }
        .waitlist-form {
          display: flex;
          gap:     10px;
          width:   100%;
          max-width: 460px;
        }
        .waitlist-input {
          flex:          1;
          padding:       12px 14px;
          background:    var(--bg-input);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          color:         var(--text-primary);
          font-size:     14px;
          outline:       none;
          /* WHY min-width 0: flex items can shrink below content size */
          min-width:     0;
        }
        .waitlist-input:focus { border-color: var(--fire); }
        .waitlist-btn { padding: 12px 20px; white-space: nowrap; flex-shrink: 0; }

        /* FAQ */
        .faq-section { width: 100%; max-width: 960px; }
        .faq-title   {
          font-size:     clamp(22px, 5vw, 32px);
          color:         var(--text-primary);
          margin-bottom: 1rem;
          text-align:    center;
        }
        /* WHY minmax(280px): smaller min = never overflows on mobile
           was 400px before → caused horizontal overflow on 360px phones */
        .faq-grid {
          display:               grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap:                   1rem;
        }
        .faq-item { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 8px; }
        .faq-q    { font-size: 15px; color: var(--text-primary); line-height: 1.4; }
        .faq-a    { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

        /* ── Responsive breakpoints ─────────────────────── */

        /* Tablet: 768px — force 2 col for plans, Squad goes full width */
        @media (max-width: 768px) {
          .plans-grid {
            /* WHY: auto-fit with 300px min naturally creates 2 col at 640-768px
               Squad card stretches to fill → looks intentional as CTA */
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          }
        }

        /* Mobile: 540px */
        @media (max-width: 540px) {
          .pricing-page  { padding: 1.25rem 0.875rem 6rem; gap: 1.5rem; }
          .plans-grid    { grid-template-columns: 1fr; }
          .faq-grid      { grid-template-columns: 1fr; }
          .waitlist-form { flex-direction: column; align-items: stretch; }
          .waitlist-btn  { width: 100%; }
          .faq-item      { padding: 1rem 1.25rem; }
        }

        /* Small phone: 380px */
        @media (max-width: 380px) {
          .plan-card   { padding: 1.25rem; padding-top: 1.75rem; }
          .plan-amount { font-size: 28px; }
          .plan-name   { font-size: 18px; }
          .free-reminder { font-size: 11px; }
        }
      `}</style>
        </main>
    )
}