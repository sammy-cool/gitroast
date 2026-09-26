'use client'

// ============================================================
// GITROAST — Pricing Page
// ============================================================
// WHAT: Displays all 3 plans using PricingCard component.
//       Fetches plan data from backend — single source of truth.
//
// WHY fetch from backend (GET /api/payment/plans):
//   If price changes in paymentService.js → page auto-updates
//   No need to update frontend hardcoded values separately
//   Single source of truth = no price mismatch bugs
//
// WHY PricingCard component (not inline card JSX):
//   DRY principle — card design in one place
//   Pricing page = layout + logic only
//   PricingCard = display only
//   Change card design once → all plans update
//
// WHERE: client/src/app/pricing/page.jsx
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createToast } from 'customizable-toast-notification'
import PaymentModal from '@/components/PaymentModal'
import PricingCard from '@/components/PricingCard'
import GitHubLoginBtn from '@/components/GitHubLoginBtn'
import Breadcrumb from '@/components/Breadcrumb'
import { useAuth } from '@/context/AuthContext'
import { dispatchContactMessage } from '@/services/roastService'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// WHY frontend PLANS config separate from backend:
//   Backend PLANS has: id, name, amount, currency (payment data)
//   Frontend needs: features, badge, highlight, cta, comingSoon (display data)
//   Merge both → complete plan object passed to PricingCard
//
// WHY not fetch features from backend:
//   Features are marketing copy — not business logic
//   Changing feature bullet = frontend deploy only (fast)
//   Changing price = backend deploy + env var (intentionally harder)
const PLANS_DISPLAY = {
    roaster: {
        tagline: 'The Real Roast',
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
    historian: {
        tagline: 'The Long Game',
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
    squad: {
        tagline: 'The Bloodbath',
        badge: 'COMING SOON',
        highlight: false,
        comingSoon: true,
        cta: 'Notify Me When Live',
        ctaSubtext: 'Be first when we launch',
        displayPrice: 'Coming Soon',
        features: [
            { text: 'Roast your entire engineering team', hot: true },
            { text: 'Private team leaderboard', hot: false },
            { text: 'All vs All battle mode', hot: true },
            { text: 'Team shame analytics dashboard', hot: false },
            { text: 'Custom roast branding', hot: false },
            { text: 'Weekly team roast digest email', hot: false },
        ],
    },
}

const FAQ = [
    {
        q: 'What counts as a "real AI roast"?',
        a: 'Free tier uses a rule-based engine — templates + your stats. Pro uses Google Gemini AI (Gemini 3.1 Pro & 2.5 Flash) with your actual GitHub data, writing a unique comedy roast every time. Not a template. Not a script.',
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
        q: "Roaster vs Historian — what's different?",
        a: 'Roaster gets you the full AI roast experience. Historian adds monthly automated reports — score trends, improvement tracking, roast streak. For developers who track everything.',
    },
]

export default function PricingPageClient() {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [plans, setPlans] = useState([])
    const [plansLoading, setPlansLoading] = useState(true)
    const [waitlistEmail, setWaitlistEmail] = useState('')
    const [waitlistDone, setWaitlistDone] = useState(false)
    const { user, isPro, loginWithGitHub } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // WHY fetch from backend:
        //   Price (amount) is the source of truth on server
        //   Merge server payment data with frontend display config
        async function loadPlans() {
            try {
                const res = await fetch(`${API_BASE}/api/payment/plans`)
                const json = await res.json()

                if (json.success && json.plans) {
                    // WHY merge: server has price, frontend has features/display
                    const merged = json.plans.map(serverPlan => ({
                        ...serverPlan,
                        ...(PLANS_DISPLAY[serverPlan.id] || {}),
                        // WHY format displayPrice from amount:
                        //   Server sends amount in paise (9900)
                        //   Convert: 9900 / 100 = ₹99
                        displayPrice: PLANS_DISPLAY[serverPlan.id]?.comingSoon
                            ? 'Coming Soon'
                            : `₹${serverPlan.amount / 100}`,
                    }))

                    // WHY add Squad manually:
                    //   Squad is coming soon — not in backend PLANS
                    //   Frontend defines it as a placeholder
                    const hasSquad = merged.find(p => p.id === 'squad')
                    if (!hasSquad) {
                        merged.push({ id: 'squad', ...PLANS_DISPLAY.squad })
                    }

                    setPlans(merged)
                }
            } catch (err) {
                // WHY fallback to display config only:
                //   If backend unreachable — still show pricing page
                //   User sees plans without price → better than blank page
                console.error('[Pricing] Failed to load plans:', err.message)
                const fallback = Object.entries(PLANS_DISPLAY).map(([id, display]) => ({
                    id,
                    name: id === 'roaster' ? '🔥 Roaster' : id === 'historian' ? '📈 Historian' : '⚔️ Squad',
                    ...display,
                }))
                setPlans(fallback)
            } finally {
                setPlansLoading(false)
            }
        }

        loadPlans()
    }, [])

    function handleSelectPlan(planId) {
        const plan = plans.find(p => p.id === planId)

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
            // ── Seamless Plan Upgrade Handling ──────────────────────────
            // ── WHAT: ────────────────────────────────────────────────────
            // Allows active Roaster subscribers to upgrade directly to the Historian tier.
            // ── WHY: ─────────────────────────────────────────────────────
            // Pro users on the base ₹99 tier should not be blocked from purchasing the ₹199
            // Historian plan containing long-term historical tracking and archives.
            // ── WHERE & WHEN TO USE: ─────────────────────────────────────
            // Plan selection router when caller has an active Pro membership.
            // ── USE CASES: ───────────────────────────────────────────────
            // Roaster user clicking "Upgrade to Historian ⚡" on /pricing.
            // ── WHEN NOT TO USE: ─────────────────────────────────────────
            // When user is already on the Historian plan or re-selecting their active tier.
            const userPlan = user?.proPlan || 'roaster';
            if (userPlan === 'roaster' && planId === 'historian') {
                setSelectedPlan(planId);
                return;
            }
            createToast({
                type: 'info',
                message: userPlan === 'historian'
                    ? '⚡ You are already on the Historian plan with maximum access!'
                    : '⚡ You are already subscribed to this plan.',
                position: 'top-center',
                duration: 4000,
            });
            return;
        }
        setSelectedPlan(planId)
    }

    function handleWaitlist(e) {
        e.preventDefault()
        const trimmedEmail = waitlistEmail.trim()
        if (!trimmedEmail) return
        setWaitlistDone(true)

        // ── Wire Waitlist Persistence to Backend ───────────────────────
        // WHAT: Persists early access waitlist lead directly to the database.
        // WHY: Replaces a purely client-side mock simulation with real lead capture,
        //      creating a ContactMessage record for notifications and follow-up.
        // WHERE & WHEN TO USE: Whenever a user signs up for an unlaunched tier.
        // USE CASES: Squad plan waitlist, beta feature previews.
        // WHEN NOT TO USE: For active checkout tiers that open the payment modal.
        dispatchContactMessage({
            name: 'Squad Waitlist Lead',
            email: trimmedEmail,
            category: 'pro',
            message: 'Requested early access to the GitRoast Squad Tier plan (waitlist signup).',
        }).catch(() => {
            // Non-blocking: UI already confirms signup to user
        })

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
                <Link href="/" className="btn btn-ghost">
                    ← Home
                </Link>
                <GitHubLoginBtn variant="compact" />
            </nav>

            {/* Breadcrumb */}
            <div className="pricing-breadcrumb-wrap">
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]} />
            </div>

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

            {/* Plans grid — uses PricingCard component */}
            {plansLoading ? (
                <div className="plans-grid">
                    {[1, 2, 3].map(i => <div key={i} className="plan-skeleton" />)}
                </div>
            ) : (
                <div className="plans-grid">
                    {plans.map(plan => (
                        // WHY PricingCard not inline JSX:
                        //   DRY — card design in one place
                        //   This page = layout + logic only
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            onSelect={handleSelectPlan}
                        />
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
                        <button type="button" className="btn btn-primary waitlist-btn" onClick={handleWaitlist}>
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

            {/* Payment modal — portal-based */}
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
          /* 
            ── WHAT: ────────────────────────────────────────────────────────
            Pricing page container padding.
            
            ── WHY: ─────────────────────────────────────────────────────────
            Per AGENTS.md Rule 2.3, the fixed site footer requires at least 6.5rem
            bottom clearance to prevent CTA buttons and FAQ items from being hidden.
            
            ── WHERE & WHEN TO USE: ─────────────────────────────────────────
            Top-level page containers.
            
            ── USE CASES: ───────────────────────────────────────────────────
            Pricing page layout rendering.
            
            ── WHEN NOT TO USE: ─────────────────────────────────────────────
            Components nested inside sub-containers.
          */
          padding:        1.5rem 1rem 6.5rem;
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
        .pricing-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
          max-width:       960px;
        }
        .pricing-breadcrumb-wrap {
          width:     100%;
          max-width: 960px;
          margin-top: -1rem;
        }
        .pricing-header {
          text-align:     center;
          width:          100%;
          max-width:      640px;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            12px;
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

        /* WHY minmax(280px): cards never overflow on mobile
           auto-fit: 3 col desktop, 2 col tablet, 1 col mobile */
        .plans-grid {
          display:               grid;
          gap:                   1.25rem;
          width:                 100%;
          max-width:             960px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          align-items:           start;
          /* WHY overflow visible: PricingCard badges overflow top edge */
          overflow:              visible;
          padding-top:           12px; /* WHY: space for badge overflow */
        }
        .plan-skeleton {
          height:        480px;
          border-radius: var(--radius-lg);
          background:    linear-gradient(90deg, var(--bg-card) 0%, var(--bg-elevated) 50%, var(--bg-card) 100%);
          background-size: 200%;
          animation:     shimmer 1.5s infinite;
        }

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
          display:   flex;
          gap:       10px;
          width:     100%;
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
          min-width:     0;
        }
        .waitlist-input:focus { border-color: var(--fire); }
        .waitlist-btn { padding: 12px 20px; white-space: nowrap; flex-shrink: 0; }

        /* FAQ */
        .faq-section { width: 100%; max-width: 960px; }
        .faq-title {
          font-size:     clamp(22px, 5vw, 32px);
          color:         var(--text-primary);
          margin-bottom: 1rem;
          text-align:    center;
        }
        .faq-grid {
          display:               grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap:                   1rem;
        }
        .faq-item { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 8px; }
        .faq-q    { font-size: 15px; color: var(--text-primary); line-height: 1.4; }
        .faq-a    { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

        /* Responsive */
        @media (max-width: 540px) {
          .pricing-page  { padding: 1.25rem 0.875rem 6.5rem; gap: 1.5rem; }
          .waitlist-form { flex-direction: column; align-items: stretch; }
          .waitlist-btn  { width: 100%; }
          .faq-item      { padding: 1rem 1.25rem; }
        }
        @media (max-width: 380px) {
          .free-reminder { font-size: 11px; }
        }
      `}</style>
        </main>
    )
}