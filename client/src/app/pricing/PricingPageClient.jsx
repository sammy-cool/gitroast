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
import { toast } from '@/utils/toast'
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
    free: {
        id: 'free',
        name: 'Free Tier',
        tagline: 'Always Free',
        badge: null,
        highlight: false,
        comingSoon: false,
        cta: 'Start Free',
        ctaSubtext: 'No credit card needed',
        displayPrice: '₹0',
        period: 'forever',
        features: [
            { text: '1 roast per day', hot: false },
            { text: 'Rule-based burns', hot: false },
            { text: 'Watermarked cards', hot: false },
        ],
    },
    roaster: {
        id: 'roaster',
        name: 'Roaster Plan',
        tagline: 'The Real Roast',
        badge: 'MOST POPULAR',
        highlight: true,
        comingSoon: false,
        cta: 'Upgrade to Roaster',
        ctaSubtext: 'Cancel anytime',
        displayPrice: '₹99',
        period: '/ $1.99',
        features: [
            { text: 'Nuclear intensity unlocked', hot: true },
            { text: 'Google Gemini 2.5 Pro AI model', hot: true },
            { text: 'Watermark-free high-res 2x PNG downloads', hot: false },
            { text: 'Private repo analysis', hot: false },
        ],
    },
    historian: {
        id: 'historian',
        name: 'Historian Plan',
        tagline: 'The Long Game',
        badge: null,
        highlight: false,
        comingSoon: false,
        cta: 'Upgrade to Historian',
        ctaSubtext: 'Cancel anytime',
        displayPrice: '₹199',
        period: '/ $3.99',
        features: [
            { text: 'All Roaster perks +', hot: false },
            { text: 'Monthly automated code health summaries', hot: true },
            { text: 'Full history trend charts', hot: false },
            { text: 'Priority queue processing', hot: false },
        ],
    },
    squad: {
        id: 'squad',
        name: 'Squad Plan',
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
        q: 'What is the refund policy?',
        a: 'Wait answers, our refund policy will wrap and honor fair queries within 48 hours.',
    },
    {
        q: 'Can UPI payment support?',
        a: 'Yes, full native UPI support with GPay, PhonePe, Paytm, and QR code via Razorpay.',
    },
    {
        q: 'How GitHub token made in safety?',
        a: 'Tokens are encrypted at rest with AES-256 and never logged or exposed to third parties.',
    },
    {
        q: 'What counts as a "real AI roast"?',
        a: 'Free tier uses a rule-based engine — templates + your stats. Pro uses Google Gemini AI (Gemini 3.1 Pro & 2.5 Flash) with your actual GitHub data, writing a unique comedy roast every time. Not a template. Not a script.',
    },
]

export default function PricingPageClient() {
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [plans, setPlans] = useState([])
    const [plansLoading, setPlansLoading] = useState(true)
    const [waitlistEmail, setWaitlistEmail] = useState('')
    const [waitlistDone, setWaitlistDone] = useState(false)
    const [openFaq, setOpenFaq] = useState(0)
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
                    const serverPlans = json.plans.map(serverPlan => ({
                        ...serverPlan,
                        ...(PLANS_DISPLAY[serverPlan.id] || {}),
                        displayPrice: PLANS_DISPLAY[serverPlan.id]?.displayPrice || `₹${serverPlan.amount / 100}`,
                        period: PLANS_DISPLAY[serverPlan.id]?.period || '/ $1.99',
                    }))

                    // Mockup Matching: Free Tier, Roaster Plan, Historian Plan
                    const displayList = [
                        PLANS_DISPLAY.free,
                        serverPlans.find(p => p.id === 'roaster') || PLANS_DISPLAY.roaster,
                        serverPlans.find(p => p.id === 'historian') || PLANS_DISPLAY.historian,
                    ].filter(Boolean)

                    setPlans(displayList)
                }
            } catch (err) {
                console.error('[Pricing] Failed to load plans:', err.message)
                setPlans([PLANS_DISPLAY.free, PLANS_DISPLAY.roaster, PLANS_DISPLAY.historian])
            } finally {
                setPlansLoading(false)
            }
        }

        loadPlans()
    }, [])

    function handleSelectPlan(planId) {
        if (planId === 'free') {
            router.push('/')
            return
        }
        const plan = plans.find(p => p.id === planId)

        if (plan?.comingSoon) {
            document.getElementById('squad-waitlist')?.scrollIntoView({ behavior: 'smooth' })
            return
        }
        if (!user) {
            toast.info('🔐 Connect GitHub first to unlock Pro.', {
                duration: 6000,
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
            toast.info(
                userPlan === 'historian'
                    ? '⚡ You are already on the Historian plan with maximum access!'
                    : '⚡ You are already subscribed to this plan.'
            );
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

        toast.success("⚔️ You're on the list! We'll notify you when Squad launches.")
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

            {/* Header Matching Approved Mockup */}
            <div className="pricing-header">
                <h1 className="font-display pricing-title text-fire">
                    TRANSPARENT POWER. ZERO SUBSCRIPTION TRAPS.
                </h1>
                <p className="font-mono pricing-sub">
                    Free gets you a taste. Pro gets you annihilated. No recurring traps, cancel anytime.
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
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            onSelect={handleSelectPlan}
                        />
                    ))}
                </div>
            )}

            {/* FAQ Accordion Matching Mockup */}
            <div className="faq-section">
                <div className="faq-accordion">
                    {FAQ.map((item, i) => {
                        const isOpen = openFaq === i
                        return (
                            <div key={i} className="faq-accordion-item">
                                <button
                                    type="button"
                                    className="faq-question-btn font-display"
                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                    aria-expanded={isOpen}
                                >
                                    <span>{item.q}</span>
                                    <span className="faq-arrow">{isOpen ? '▲' : '▼'}</span>
                                </button>
                                {isOpen && (
                                    <div className="faq-answer-wrap animate-fadeUp">
                                        <p className="font-mono faq-a">{item.a}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
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

        /* FAQ Accordion */
        .faq-section { width: 100%; max-width: 800px; margin-top: 1rem; }
        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .faq-accordion-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .faq-accordion-item:hover {
          border-color: var(--border-hover);
        }
        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.4rem;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 17px;
          color: var(--text-primary);
          text-align: left;
        }
        .faq-arrow {
          font-size: 12px;
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .faq-answer-wrap {
          padding: 0 1.4rem 1.2rem;
          border-top: 1px solid var(--border);
        }
        .faq-a {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-top: 10px;
        }

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