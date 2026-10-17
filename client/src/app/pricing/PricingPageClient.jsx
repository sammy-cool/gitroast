'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { toast, notify } from '@/utils/toast'
import PaymentModal from '@/components/PaymentModal'
import Faq from '@/components/home/Faq'
import { usePlans } from '@/components/home/PlansSection'
import { formatPrice, dispatchContactMessage } from '@/services/roastService'
import './pricing.css'

const DETAILS = {
  free: {
    cta: 'Start free',
    points: ['3 AI roasts per month, then rules-engine roasts', '1 roast per day (fair-use guard)', 'Public result page and share card', 'Community and Wall of Shame'],
  },
  roaster: {
    cta: 'Go Pro',
    points: ['30 AI roasts per billing cycle, then rules-engine roasts', 'Nuclear intensity, personas and Ghost Mode', 'HD card download, no watermark', 'Private repositories analyzed', 'Score history with charts', 'README badges'],
  },
  historian: {
    cta: 'Choose Historian',
    points: ['Everything in Pro Roaster, 200 AI roasts per cycle', 'Monthly report and score trends', 'Roast streak tracking', 'Comparison and trend exports', 'Priority analysis queue'],
  },
}

export default function PricingPageClient() {
  const { user, isPro, loginWithGitHub } = useAuth()
  const { plans, currency, country, live } = usePlans()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  function choose(planId) {
    if (planId === 'free') return
    if (!user) {
      toast.info('Sign in to upgrade', {
        description: 'Connect GitHub so the plan attaches to your account.',
        action: { label: 'Sign in', onClick: loginWithGitHub },
      })
      return
    }
    if (isPro) {
      const current = user.proPlan || 'roaster'
      if (current === 'historian' || (current === 'roaster' && planId === 'roaster')) {
        toast.info('You already have this plan', { description: current === 'historian' ? 'Historian includes every Pro feature.' : 'Pro Roaster is active on your account.' })
        return
      }
    }
    setSelectedPlan(planId)
  }

  function joinWaitlist(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setJoined(true)
    dispatchContactMessage({
      name: 'Squad Waitlist Lead',
      email: trimmed,
      category: 'pro',
      message: 'Requested early access to the GitRoast Squad plan (waitlist signup).',
    }).catch(() => {})
    toast.success("You're on the list", { description: "We'll email you when Squad launches." })
  }

  return (
    <main className="pricing">
      <section className="pricing-head gr-page">
        <p className="gr-eyebrow">Plans</p>
        <h1 className="gr-h1">Free to get roasted. Pro to remember everything.</h1>
        <p className="gr-lede">Clear limits, no surprise heat. Cancel before your next billing date and you keep access until the period ends.</p>
        <p className="gr-help pricing-region">Prices shown in {currency}{live ? ` for ${country}` : ''}. Taxes may apply at checkout.</p>
      </section>

      <section className="gr-page pricing-grid" aria-label="Plans">
        {plans.map((p) => {
          const featured = p.id === 'roaster'
          const d = DETAILS[p.id] || { cta: 'Choose', points: p.features || [] }
          return (
            <article key={p.id} className={`gr-card pricing-plan${featured ? ' gr-card--dark' : ''}`} aria-labelledby={`plan-${p.id}`}>
              <div className="home-plan__top">
                <h2 id={`plan-${p.id}`} className="home-plan__name">{p.name}</h2>
                {p.badge && <span className="gr-pill gr-pill--ember">{p.badge}</span>}
              </div>
              <p className="home-plan__price">
                <span className={featured ? 'home-plan__amt home-plan__amt--gold' : 'home-plan__amt'}>{formatPrice(p.amount, p.currency || currency)}</span>
                <small>per month</small>
              </p>
              <p className="home-plan__tag">{p.tagline}</p>
              <ul className="pricing-points">
                {d.points.map((t) => <li key={t}>{t}</li>)}
              </ul>
              {p.id === 'free'
                ? <Link href="/#roast" className="gr-btn gr-btn--outline gr-btn--block">{d.cta}</Link>
                : <button type="button" className={`gr-btn gr-btn--block ${featured ? 'gr-btn--primary' : 'gr-btn--outline'}`} onClick={() => choose(p.id)}>{d.cta}</button>}
            </article>
          )
        })}
      </section>

      <section className="gr-page pricing-pair">
        <div className="gr-card gr-card--blue">
          <h2 className="rc-card-title">How payment works</h2>
          <p className="gr-help">Secure checkout via Razorpay: cards, UPI, netbanking and wallets where available. International cards are supported. You can see the exact amount before you pay.</p>
        </div>
        <form className="gr-card gr-card--gold" onSubmit={joinWaitlist}>
          <h2 className="rc-card-title">Squad — coming soon</h2>
          <p className="gr-help">Roast your whole team, private leaderboards and all-vs-all battles.</p>
          {joined ? <p role="status" className="pricing-joined">You&apos;re on the list.</p> : (
            <>
              <label className="gr-label" htmlFor="squad-email">Email for early access</label>
              <input id="squad-email" className="gr-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              <button type="submit" className="gr-btn gr-btn--dark">Notify me</button>
            </>
          )}
        </form>
      </section>

      <section className="gr-page pricing-faq home-split home-split--faq">
        <div>
          <p className="gr-eyebrow">FAQ / The useful kind</p>
          <h2 className="gr-h2">Before you hand us the matches.</h2>
        </div>
        <Faq items={[
          ['What counts as an AI roast?', 'Free uses a rule-based engine from your public stats. Pro uses generative AI over your public GitHub data to write a new roast each time.'],
          ['Can I cancel anytime?', 'Yes. Cancel before the next billing date and you keep your plan until the period ends.'],
          ['Why do prices differ by country?', 'We adjust to your region and currency. The server computes the price at checkout, so what you see is what you pay.'],
          ['Pro Roaster vs Historian?', 'Pro Roaster gives the full roast experience. Historian adds monthly reports, trends and comparisons for people who track everything.'],
        ]} />
      </section>

      {selectedPlan && <PaymentModal planId={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </main>
  )
}
