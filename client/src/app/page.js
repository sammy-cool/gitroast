// WHY 'use client': This page has interactive state (input, button clicks)
//     Next.js runs components on server by default.
//     'use client' tells it: "this one needs browser JavaScript"
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import UsernameInput from '@/components/UsernameInput'
import ProModal from '@/components/ProModal'

export default function HomePage() {
  // WHY useState: tracks whether Pro modal is open
  const [showProModal, setShowProModal] = useState(false)
  const router = useRouter()

  function handleRoast(username) {
    if (!username.trim()) {
      // WHY: use YOUR toast package for all user feedback
      createToast({
        type: 'warning',
        message: 'Enter a GitHub username first!',
        position: 'top-center',
        showProgressBar: true,
        textColor: "snow"
      })
      return
    }
    // WHY: navigate to /roast/[username] — Next.js dynamic route
    router.push(`/roast/${username.trim().toLowerCase()}`)
  }

  return (
    <main className="landing-page">

      {/* ── Ambient glow background ─────────────── */}
      <div className="landing-glow animate-glow" />

      {/* ── Logo ─────────────────────────────────── */}
      <div className="landing-logo">
        <h1 className="font-display text-fire">GITROAST 🔥</h1>
        <p className="landing-tagline">
          Get your GitHub{' '}
          <span style={{ color: 'var(--fire)' }}>brutally roasted.</span>
          {' '}Share the pain.
        </p>
      </div>

      {/* ── Input ─────────────────────────────────── */}
      <UsernameInput onSubmit={handleRoast} />

      {/* ── Social proof ──────────────────────────── */}
      <p className="landing-social-proof font-mono">
        <span style={{ color: 'var(--fire)' }}>1,247</span>
        {' '}devs roasted this week
      </p>

      {/* ── Pro teaser and Pricing btn ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn btn-outline"
          onClick={() => router.push('/pricing')}
        >
          ⚡ Pricing
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setShowProModal(true)}
        >
          What&apos;s in Pro?
        </button>
      </div>

      {/* leaderboard link */}
      <button
        className="btn btn-ghost"
        onClick={() => router.push('/leaderboard')}
      >
        🏆 Wall of Shame
      </button>

      {/* ── Sample roast card ─────────────────────── */}
      <div className="sample-roast card">
        <p className="sample-roast-label font-mono">SAMPLE ROAST</p>
        <p className="sample-roast-text">
          &ldquo;Your GitHub is a graveyard of ambition. 47 repos, zero READMEs,
          and a commit that says &apos;pls work&apos; at 3:47 AM.&rdquo;
        </p>
      </div>

      {/* ── Pro Modal ─────────────────────────────── */}
      {showProModal && (
        <ProModal onClose={() => setShowProModal(false)} />
      )}

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          justify-content: center;
          padding:        2rem 1rem;
          position:       relative;
          overflow:       hidden;
          gap:            1.5rem;
        }
        .landing-glow {
          position:   absolute;
          inset:      0;
          background: radial-gradient(
            ellipse 80% 40% at 50% 100%,
            rgba(255, 69, 0, 0.2) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .landing-logo { text-align: center; }
        .landing-logo h1 {
          font-size:      clamp(56px, 14vw, 96px);
          letter-spacing: 4px;
          line-height:    1;
          user-select:    none;
        }
        .landing-tagline {
          color:      var(--text-secondary);
          font-size:  17px;
          margin-top: 10px;
        }
        .landing-social-proof {
          color:     var(--text-secondary);
          font-size: 13px;
        }
        .sample-roast {
          width:         100%;
          max-width:     460px;
          padding:       1.1rem 1.25rem;
          border-left:   3px solid var(--fire);
          border-radius: var(--radius-md);
        }
        .sample-roast-label {
          color:          var(--text-muted);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom:  8px;
        }
        .sample-roast-text {
          color:       #555;
          font-size:   13px;
          font-style:  italic;
          line-height: 1.7;
        }
      `}</style>
    </main>
  )
}