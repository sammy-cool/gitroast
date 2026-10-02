"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRecruiterAuth } from '@/context/RecruiterAuthContext'
import { toast } from '@/utils/toast'
import { playClick } from '@/utils/soundFX'

/**
 * ── RecruiterLoginClient ──────────────────────────────────────────
 * WHAT: Authentication portal & role-entry shell for technical recruiters.
 * Replicates the verified master Figma design in storage/figma/slices/Role entry and authentication — desktop.png.
 * 
 * WHY:
 * Provides a 50/50 split presentation separating the developer ecosystem
 * from the recruiter intelligence platform with distinct tone, aesthetics, and OAuth routing.
 * 
 * WHERE & WHEN TO USE:
 * Mounted at /recruiter/login.
 * 
 * USE CASES:
 * Technical talent acquisition, engineering hiring managers, and headhunters.
 * 
 * WHEN NOT TO USE:
 * Developer GitHub authentication (routed through /api/auth/github).
 */
export default function RecruiterLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithGoogle, loginWithEmail } = useRecruiterAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedEthical, setAgreedEthical] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // ── Consume OAuth Redirect Errors Gracefully ────────────────────
  useEffect(() => {
    const authError = searchParams.get('auth_error')
    if (!authError) return

    if (authError === 'oauth_unconfigured') {
      toast.warning('Google Sign-In is temporarily unavailable. Please sign in with your email below!', {
        duration: 6500,
      })
    } else if (authError === 'access_denied') {
      toast.info('Google sign-in was cancelled.')
    } else {
      toast.error('Google authentication failed. Please try email login.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreedEthical) {
      toast.warning('Please confirm agreement to ethical developer evidence evaluation.')
      return
    }
    playClick()
    setIsLoading(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Successfully logged in! Welcome to GitRoast Talent.')
      router.push('/recruiter/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleClick = () => {
    playClick()
    loginWithGoogle()
  }

  return (
    <div className="role-auth-page">
      {/* ── Left Column: Obsidian Editorial Value Presentation ── */}
      <aside className="role-auth-aside">
        <div className="aside-top">
          <Link href="/" className="aside-brand font-display">
            GITROAST <span className="brand-burn">🔥</span>
            <span className="recruiter-preview-pill font-mono">Recruiter preview</span>
          </Link>
        </div>

        <div className="aside-center">
          <span className="aside-eyebrow font-mono">A CLEARER WAY INTO GITROAST</span>
          <h1 className="aside-headline font-serif">
            Find the work behind the profile.
          </h1>
          <p className="aside-sub">
            Explore explainable public evidence for role fit—project depth, consistency and collaboration—without treating a roast like a hiring score.
          </p>

          <div className="value-pillars">
            <div className="pillar-item">
              <div className="pillar-icon">⌖</div>
              <div className="pillar-content">
                <h3 className="pillar-title">Evidence, not vibes</h3>
                <p className="pillar-desc">Every signal links to a public source and time window.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon">⚖</div>
              <div className="pillar-content">
                <h3 className="pillar-title">Professional context stays separate</h3>
                <p className="pillar-desc">Playful roast copy never appears in talent evaluation.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon">🛡</div>
              <div className="pillar-content">
                <h3 className="pillar-title">Privacy boundaries built in</h3>
                <p className="pillar-desc">Opt-outs, public-only data and ethical-use guidance stay visible.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="aside-footer font-mono">
          DESIGN CONCEPT FOR APPROVAL • SAMPLE ORGANIZATION DATA
        </div>
      </aside>

      {/* ── Right Column: Warm Paper Path Choice & Login Form ── */}
      <main className="role-auth-main">
        <div className="role-choice-section">
          <span className="choice-eyebrow font-mono">CHOOSE YOUR PATH</span>
          <h2 className="choice-title font-serif">How will you use GitRoast?</h2>

          <div className="role-cards-grid">
            {/* Developer Card */}
            <div className="role-card role-card--dev">
              <div className="role-card-top">
                <span className="role-card-icon font-mono">&lt;/&gt;</span>
              </div>
              <h3 className="role-card-title">I&apos;m a developer</h3>
              <p className="role-card-desc">Roast profiles, track history and earn badges.</p>
              <Link href="/" className="btn-role-action font-mono">
                Continue with GitHub
              </Link>
            </div>

            {/* Recruiter Card (Selected) */}
            <div className="role-card role-card--recruiter role-card--selected">
              <div className="role-card-top">
                <span className="role-card-icon">💼</span>
                <span className="selected-badge font-mono">Selected</span>
              </div>
              <h3 className="role-card-title">I&apos;m a recruiter</h3>
              <p className="role-card-desc">Search public evidence, save talent and build shortlists.</p>
              <div className="btn-role-action btn-role-action--selected font-mono">
                Continue as recruiter →
              </div>
            </div>
          </div>
        </div>

        <div className="role-divider-line" />

        {/* Workspace Login Form */}
        <section className="workspace-auth-section">
          <h3 className="workspace-title font-sans">Sign in to recruiter workspace</h3>
          <p className="workspace-sub font-mono">No GitHub account required.</p>

          <button
            type="button"
            onClick={handleGoogleClick}
            className="btn-google-oauth font-mono"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-or-row">
            <span className="or-line" />
            <span className="or-text font-mono">or professional email</span>
            <span className="or-line" />
          </div>

          <form onSubmit={handleSubmit} className="recruiter-login-form">
            <div className="input-field-group">
              <label htmlFor="login-email" className="input-field-label font-mono">
                Work email
              </label>
              <div className="input-icon-wrap">
                <span className="field-icon">✉</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="editorial-input font-mono"
                />
              </div>
            </div>

            <div className="input-field-group">
              <label htmlFor="login-pass" className="input-field-label font-mono">
                Password
              </label>
              <div className="input-icon-wrap">
                <span className="field-icon">🔒</span>
                <input
                  id="login-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="editorial-input font-mono"
                />
              </div>
            </div>

            <label className="ethical-checkbox-row font-sans">
              <input
                type="checkbox"
                checked={agreedEthical}
                onChange={(e) => setAgreedEthical(e.target.checked)}
                className="ethical-checkbox"
              />
              <span>I agree to use public developer evidence responsibly and not infer sensitive personal attributes.</span>
            </label>

            <button
              type="submit"
              className="btn-submit-workspace font-mono"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In…' : 'Sign in to recruiter workspace →'}
            </button>
          </form>

          <p className="auth-switch-text font-mono">
            New here?{' '}
            <Link href="/recruiter/register" className="auth-switch-link">
              Create a recruiter workspace
            </Link>
          </p>

          <div className="trust-badges-row font-mono">
            <span className="trust-badge-item">🛡 Public evidence only</span>
            <span className="trust-badge-item">🔑 Encrypted sign-in</span>
            <span className="trust-badge-item">👤 Human review expected</span>
          </div>
        </section>
      </main>

      <style jsx>{`
        .role-auth-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 46% 54%;
          background: #F7F5F0;
        }

        /* ── Left Obsidian Column ── */
        .role-auth-aside {
          background: #171717;
          color: #ffffff;
          padding: 3.5rem 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        .aside-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 1.5rem;
          color: #ffffff;
          text-decoration: none;
          letter-spacing: 0.05em;
        }
        .brand-burn {
          color: #EA580C;
        }
        .recruiter-preview-pill {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(234, 88, 12, 0.15);
          color: #FF8A4C;
          border: 1px solid rgba(234, 88, 12, 0.3);
          font-weight: 600;
        }
        .aside-center {
          margin: 3rem 0;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .aside-eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: #A3A3A3;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .aside-headline {
          font-size: 2.75rem;
          line-height: 1.15;
          color: #ffffff;
          margin: 0;
        }
        .aside-sub {
          font-size: 15px;
          line-height: 1.6;
          color: #D4D4D4;
          margin: 0 0 1rem;
        }
        .value-pillars {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .pillar-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          color: #EA580C;
        }
        .pillar-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 2px;
        }
        .pillar-desc {
          font-size: 12px;
          line-height: 1.5;
          color: #A3A3A3;
          margin: 0;
        }
        .aside-footer {
          font-size: 10px;
          letter-spacing: 0.05em;
          color: #737373;
        }

        /* ── Right Warm Paper Column ── */
        .role-auth-main {
          padding: 3.5rem 4rem 7.5rem; /* Minimum 6.5rem bottom clearance per Rule 2.3 */
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 680px;
        }
        .choice-eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 6px;
        }
        .choice-title {
          font-size: 2.25rem;
          color: #171717;
          margin: 0 0 1.25rem;
          line-height: 1.2;
        }
        .role-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .role-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .role-card--selected {
          background: #FFF7ED;
          border-color: #FDBA74;
        }
        .role-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .role-card-icon {
          font-size: 16px;
        }
        .selected-badge {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          background: #ffffff;
          border: 1px solid #FDBA74;
          padding: 2px 6px;
          border-radius: 9999px;
        }
        .role-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .role-card-desc {
          font-size: 12px;
          color: #64748B;
          line-height: 1.4;
          margin: 0 0 8px;
          flex: 1;
        }
        .btn-role-action {
          display: block;
          text-align: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid #D1D5DB;
          color: #374151;
          background: #ffffff;
          cursor: pointer;
        }
        .btn-role-action--selected {
          background: #EA580C;
          color: #ffffff;
          border-color: #EA580C;
        }

        .role-divider-line {
          height: 1px;
          background: #E5E7EB;
          width: 100%;
        }

        /* ── Workspace Form Section ── */
        .workspace-auth-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .workspace-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .workspace-sub {
          font-size: 12px;
          color: #64748B;
          margin: 0 0 4px;
        }
        .btn-google-oauth {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #171717;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-google-oauth:hover {
          background: #f9fafb;
          border-color: #9CA3AF;
        }

        .auth-or-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .or-line {
          flex: 1;
          height: 1px;
          background: #E5E7EB;
        }
        .or-text {
          font-size: 11px;
          color: #94A3B8;
        }

        .recruiter-login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .input-field-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
        }
        .input-icon-wrap {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 0 12px;
          transition: border-color 0.15s ease;
        }
        .input-icon-wrap:focus-within {
          border-color: #EA580C;
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.15);
        }
        .field-icon {
          font-size: 14px;
          color: #9CA3AF;
          margin-right: 8px;
        }
        .editorial-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 0;
          font-size: 13px;
          color: #171717;
        }

        .ethical-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
          cursor: pointer;
        }
        .ethical-checkbox {
          margin-top: 2px;
          accent-color: #EA580C;
        }

        .btn-submit-workspace {
          background: #EA580C;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-submit-workspace:hover:not(:disabled) {
          background: #C2410C;
        }
        .btn-submit-workspace:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-switch-text {
          font-size: 12px;
          color: #64748B;
          text-align: center;
          margin: 6px 0 0;
        }
        .auth-switch-link {
          color: #EA580C;
          font-weight: 600;
          text-decoration: none;
        }
        .auth-switch-link:hover {
          text-decoration: underline;
        }

        .trust-badges-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #E5E7EB;
          gap: 8px;
          flex-wrap: wrap;
        }
        .trust-badge-item {
          font-size: 11px;
          color: #64748B;
        }

        @media (max-width: 960px) {
          .role-auth-page {
            grid-template-columns: 1fr;
          }
          .role-auth-aside {
            padding: 2.5rem 2rem;
          }
          .role-auth-main {
            padding: 2.5rem 2rem 7.5rem;
          }
        }
      `}</style>
    </div>
  )
}
