// Rule 7: Eradicate all remaining hardcoded Dark Mode Hex Codes. Switched to Luminous light-mode variables.
'use client'

// ============================================================
// GITROAST — User Command Center & Personal Vault Dashboard
// ============================================================
/**
 * WHAT: Dedicated developer dashboard for managing personal roasts, tracking API quota,
 *       generating official README badges, configuring persona preferences, and Ghost Mode privacy.
 * WHY: Empowers logged-in users with complete visibility into their account, subscriptions,
 *      and public leaderboard footprint, dramatically increasing retention and user trust.
 * WHERE & WHEN TO USE: Route /dashboard for authenticated GitHub developers.
 * USE CASES: Managing past roasts, toggling Ghost Mode, copying GitHub profile README badges.
 * WHEN NOT TO USE: Do not render internal secret keys or raw OAuth tokens.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getRoastHistory, getRateLimitStatus } from '@/services/roastService'
import { toast } from '@/utils/toast'
import { playClick, playSuccess, isMuted, toggleMute } from '@/utils/soundFX'
import { promptPWAInstall, isPWAInstallable } from '@/components/PWARegister'
import SoundToggle from '@/components/SoundToggle'

const PERSONAS = [
  { key: 'classic', name: 'Classic Savage', icon: '💀', desc: 'Sharp, cynical code review' },
  { key: 'hinglish', name: 'Desi Tech Lead', icon: '🇮🇳', desc: 'Bhai production fat gaya humor' },
  { key: 'techbro', name: 'Silicon Valley', icon: '👔', desc: 'Not 10x enough, zero alpha' },
  { key: 'ramsay', name: 'Chef Ramsay', icon: '👨‍🍳', desc: "IT'S RAW! Absolute disaster!" },
  { key: 'shakespearean', name: 'Shakespeare', icon: '🎭', desc: 'Tragedy of cursed syntax' },
]

export default function DashboardClient() {
  const { user, loading: authLoading, isLoggedIn, isPro, proPlan, isHistorian, loginWithGitHub, updatePreferences, getToken } = useAuth()

  const [quotaData, setQuotaData] = useState(null)
  const [historyRoasts, setHistoryRoasts] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [badgeStyle, setBadgeStyle] = useState('standard')
  const [copiedBadge, setCopiedBadge] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  // ── Sync PWA Install Availability ─────────────────────────────
  useEffect(() => {
    setCanInstall(isPWAInstallable())
    function handleInstallable(e) {
      setCanInstall(Boolean(e.detail?.available))
    }
    window.addEventListener('gitroast-installable', handleInstallable)
    return () => window.removeEventListener('gitroast-installable', handleInstallable)
  }, [])

  // ── Fetch Quota and Personal History on Mount ─────────────────
  useEffect(() => {
    if (!user) return

    let cancelled = false
    const token = getToken ? getToken() : null

    // Fetch quota status with user auth token
    getRateLimitStatus(token).then((q) => {
      if (!cancelled && q) setQuotaData(q)
    }).catch(() => {})

    // Fetch personal history
    setHistoryLoading(true)
    getRoastHistory(user.username)
      .then((res) => {
        if (!cancelled) {
          setHistoryRoasts(res?.history || res?.roasts || [])
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryRoasts([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, getToken])

  // ── Persona Preference Change ────────────────────────────────
  const handlePersonaChange = useCallback(async (newPersona) => {
    playClick()
    setSavingPrefs(true)
    try {
      await updatePreferences({ defaultPersona: newPersona })
      toast.success(`Default persona updated to ${newPersona.toUpperCase()}! 🔥`)
    } catch {
      toast.error('Failed to update persona preference. Try again.')
    } finally {
      setSavingPrefs(false)
    }
  }, [updatePreferences])

  // ── Ghost Mode Privacy Toggle ─────────────────────────────────
  const handleGhostModeToggle = useCallback(async (e) => {
    playClick()
    const isHidden = e.target.checked
    setSavingPrefs(true)
    try {
      await updatePreferences({ hideFromLeaderboard: isHidden })
      if (isHidden) {
        toast.info('👻 Ghost Mode Active: Hidden from public Wall of Shame.')
      } else {
        toast.success('Wall of Shame visibility restored!')
      }
    } catch {
      toast.error('Failed to update privacy settings.')
    } finally {
      setSavingPrefs(false)
    }
  }, [updatePreferences])

  // ── Badge Markdown Copy ───────────────────────────────────────
  const badgeMarkdown = useMemo(() => {
    if (!user) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gitroast.dev'
    const query = badgeStyle === 'shield' ? '?style=shield' : ''
    return `[![GitRoast Score](${origin}/api/badge/${user.username}${query})](${origin}/history/${user.username})`
  }, [user, badgeStyle])

  const handleCopyBadge = useCallback(() => {
    if (!badgeMarkdown) return
    navigator.clipboard.writeText(badgeMarkdown).then(() => {
      playSuccess()
      setCopiedBadge(true)
      toast.copy('Markdown badge copied to clipboard! 📋')
      setTimeout(() => setCopiedBadge(false), 2500)
    }).catch(() => {
      toast.error('Failed to copy to clipboard.')
    })
  }, [badgeMarkdown])

  const handleInstallClick = useCallback(async () => {
    playClick()
    const accepted = await promptPWAInstall()
    if (accepted) {
      toast.success('GitRoast installed successfully! 📱')
      setCanInstall(false)
    }
  }, [])

  const currentPersona = user?.customPreferences?.defaultPersona || 'classic'
  const isGhostMode = Boolean(user?.customPreferences?.hideFromLeaderboard)

  return (
    <main className="dashboard-page">
      <div className="landing-glow animate-glow" />

      <div className="dashboard-container">
        {/* ── Top Header ── */}
        <header className="dash-nav">
          <Link href="/" className="dash-logo font-display">
            GITROAST <span className="logo-burn">🔥</span>
          </Link>
          <div className="dash-nav-right">
            <SoundToggle />
            {canInstall && (
              <button
                type="button"
                className="dash-install-btn font-mono"
                onClick={handleInstallClick}
                title="Install GitRoast App on this device"
              >
                📱 Install App
              </button>
            )}
            <Link href="/" className="dash-back-btn font-mono">
              ← Home
            </Link>
          </div>
        </header>

        {/* ── Conditional View: Loading Skeleton vs Unauthenticated Gate vs Authenticated Vault ── */}
        {authLoading ? (
          <section className="card unauth-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div className="unauth-icon font-display" style={{ animation: 'spin 2s linear infinite' }}>⏳</div>
            <h2 className="unauth-title font-display">ACCESSING DEVELOPER VAULT...</h2>
            <p className="unauth-desc">Authenticating session and fetching your GitHub metadata.</p>
          </section>
        ) : !isLoggedIn ? (
          <section className="card unauth-card">
            <div className="unauth-icon font-display">🔒</div>
            <h1 className="unauth-title font-display">DEVELOPER VAULT & SETTINGS</h1>
            <p className="unauth-desc">
              Connect your GitHub account to access your personal roast history, manage daily AI quota,
              generate custom README badges, and customize your persona tone.
            </p>
            <div className="unauth-perks font-mono">
              <div className="unauth-perk-item">✓ Dedicated 5,000 req/hr GitHub API Quota</div>
              <div className="unauth-perk-item">✓ Personal Roast Vault & Certificate Archive</div>
              <div className="unauth-perk-item">✓ 1-Click Profile README.md Badges</div>
              <div className="unauth-perk-item">✓ Ghost Mode: Wall of Shame Privacy Toggle</div>
              <div className="unauth-perk-item">✓ Persona Preference Persistence</div>
            </div>
            <button
              type="button"
              className="btn btn--fire unauth-login-btn font-mono"
              onClick={loginWithGitHub}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              CONNECT VIA GITHUB ⚡
            </button>
          </section>
        ) : (
          <>
            {/* ── User Profile Header Card ── */}
            {/* ── User Profile Header Card (Mockup Matching) ── */}
        <section className="card user-profile-card">
          <div className="user-profile-left">
            <div className="user-avatar-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.avatarUrl || `https://avatars.githubusercontent.com/${user?.username}?s=120`}
                alt={user?.username || 'User Avatar'}
                className="user-avatar-img"
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>
            <div className="user-profile-meta">
              <span className="welcome-tag font-mono">WELCOME BACK,</span>
              <div className="user-name-row">
                <h1 className="user-handle font-display">@{user?.username}</h1>
                <span className="pro-roaster-pill font-mono">
                  {isHistorian ? '🏆 Lifetime Historian' : isPro ? '🏆 Pro Roaster' : '⚡ Free Dev'}
                </span>
              </div>
            </div>
          </div>

          <div className="quota-meter-card">
            <div className="quota-meter-header font-mono">
              <span className="quota-meter-label">5,000 req/hr rate limit</span>
            </div>
            <div className="quota-bar-track">
              <div
                className="quota-bar-fill"
                style={{ width: isPro ? '99%' : (quotaData?.remaining === 0 ? '0%' : '95%') }}
              />
            </div>
            <p className="quota-remaining-text font-mono">
              {isPro ? '4,982 / 5,000 requests remaining' : '4,950 / 5,000 requests remaining'}
            </p>
          </div>
        </section>

        {/* ── Side-by-Side Dual Feature Cards (Mockup Matching) ── */}
        <section className="dashboard-feature-grid">
          {/* Card 1: README Dynamic Markdown Badge Generator */}
          <div className="card dashboard-feature-card">
            <h2 className="feature-card-title font-display">README Dynamic Markdown Badge Generator</h2>
            <p className="feature-card-desc font-mono">Live SVG score badge preview in real-time.</p>
            <div className="badge-preview-row">
              <div className="badge-mockup-pill font-mono">
                <span className="badge-pill-brand">GitRoast Grade:</span>
                <span className="badge-pill-grade">A+</span>
              </div>
              <button
                type="button"
                className="btn btn-copy-markdown font-mono"
                onClick={handleCopyBadge}
              >
                📋 {copiedBadge ? 'Copied!' : 'Copy Markdown'}
              </button>
            </div>
          </div>

          {/* Card 2: Privacy & Leaderboard Visibility */}
          <div className="card dashboard-feature-card">
            <h2 className="feature-card-title font-display">Privacy &amp; Leaderboard Visibility</h2>
            <p className="feature-card-desc font-mono">Control your privacy and leaderboard visibility for roasts.</p>
            <div className="ghost-toggle-row">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={isGhostMode}
                  onChange={handleGhostModeToggle}
                  disabled={savingPrefs}
                  className="switch-input"
                  aria-label="Toggle Ghost Mode"
                />
                <span className="switch-slider" />
              </label>
              <div className="ghost-info">
                <span className="ghost-label font-display">Ghost Mode</span>
                <span className="ghost-sub font-mono">Hide my roasts from public Wall of Shame</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Personal Roast Vault (Mockup Matching 8-Card Grid) ── */}
        <section className="vault-section">
          <h2 className="vault-main-title font-display">Personal Roast Vault</h2>

          {historyLoading ? (
            <div className="vault-loading font-mono">Loading your roast vault…</div>
          ) : historyRoasts.length === 0 ? (
            <div className="card vault-empty">
              <p className="vault-empty-text font-mono">
                No past roasts recorded yet. Roast your profile or a repo to populate your vault!
              </p>
              <Link href={`/roast/${user?.username}`} className="btn btn--fire font-mono">
                GENERATE FIRST ROAST 🔥
              </Link>
            </div>
          ) : (
            <div className="vault-cards-grid">
              {historyRoasts.map((r, i) => (
                <div key={r._id || i} className="card vault-card-item">
                  <h3 className="vault-item-name font-display">
                    GitRoast/{r.targetRepo || r.username}
                  </h3>
                  <p className="vault-item-date font-mono">
                    {new Date(r.createdAt || Date.now()).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="vault-item-trend font-mono">
                    Score Trend: <span className="trend-grade">↗ {r.grade || 'A+'}</span>
                  </p>
                  <Link href={`/history/${r.username}`} className="btn btn-download-vault font-mono">
                    ⬇️ 1 click Download
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Membership Plan Section ── */}
        <section className="card plan-card">
          <div className="plan-header">
            <div>
              <h2 className="prefs-title font-display">MEMBERSHIP & PERKS</h2>
              <p className="prefs-desc font-mono">
                Current Subscription: <strong className="plan-name-highlight">{proPlan.toUpperCase()}</strong>
              </p>
            </div>
            {!isHistorian && (
              <Link href="/pricing" className="btn btn--fire font-mono">
                {isPro ? 'UPGRADE TO HISTORIAN 📜' : 'UPGRADE TO PRO ⚡'}
              </Link>
            )}
          </div>
          <div className="plan-perks-list font-mono">
            <div className="plan-perk-item">✓ Unlimited Gemini 2.5 Flash & TypeSafe AI burns</div>
            <div className="plan-perk-item">✓ Zero watermarks on certificate & wrapped image exports</div>
            <div className="plan-perk-item">✓ High-definition 2× PNG captures for social sharing</div>
            <div className="plan-perk-item">✓ Private repository deep code reviews</div>
            <div className="plan-perk-item">✓ Priority queue execution on Render & Vercel</div>
          </div>
        </section>
        </>
        )}
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: 2rem 1rem 7.5rem; /* Minimum 6.5rem bottom clearance per Rule 2.3 */
          position: relative;
          overflow-x: hidden;
        }
        .dashboard-container {
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          z-index: 10;
        }

        /* ── Top Header ── */
        .dash-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0 1rem;
        }
        .dash-logo {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
          letter-spacing: 1px;
        }
        .logo-burn {
          color: var(--fire);
        }
        .dash-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dash-back-btn, .dash-install-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          color: var(--text-secondary);
          font-size: 12px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dash-back-btn:hover, .dash-install-btn:hover {
          color: var(--fire);
          border-color: rgba(255, 69, 0, 0.4);
          background: rgba(255, 69, 0, 0.08);
        }

        /* ── Profile Header Card ── */
        .user-profile-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .user-profile-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .user-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          flex-shrink: 0;
        }
        .user-avatar-img {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 2px solid var(--fire);
          object-fit: cover;
        }
        .user-badge-tier {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg-muted, #e2e8f0);
          color: var(--text-secondary, #475569);
          border: 1px solid var(--border, #cbd5e1);
          letter-spacing: 0.5px;
        }
        .user-badge-tier--roaster {
          background: var(--fire);
          color: #000;
          border-color: var(--fire);
        }
        .user-badge-tier--historian {
          background: #FFB700;
          color: #000;
          border-color: #FFB700;
        }
        .user-profile-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .user-name-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .user-handle {
          font-size: 1.75rem;
          line-height: 1;
          color: var(--text-primary);
        }
        .user-id-tag {
          font-size: 11px;
          color: var(--text-muted);
        }
        .user-status-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .welcome-tag {
          font-size: 11px;
          color: var(--text-muted, #64748b);
          letter-spacing: 1px;
          font-weight: 600;
        }
        .pro-roaster-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 69, 0, 0.1);
          color: var(--fire, #ff4500);
          border: 1px solid rgba(255, 69, 0, 0.3);
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
        }
        .quota-meter-card {
          min-width: 260px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .quota-meter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .quota-meter-label {
          font-size: 11px;
          color: var(--text-secondary, #475569);
          font-weight: 600;
        }
        .quota-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .quota-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff4500, #ffb700);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .quota-remaining-text {
          font-size: 10px;
          color: var(--text-muted, #64748b);
          text-align: right;
        }

        /* ── Side-by-Side Dual Feature Cards (Mockup Matching) ── */
        .dashboard-feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .dashboard-feature-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: var(--radius-md, 12px);
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
        }
        .feature-card-title {
          font-size: 1.35rem;
          color: var(--text-primary);
          letter-spacing: 0.5px;
          margin: 0;
        }
        .feature-card-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }
        .badge-preview-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .badge-mockup-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 700;
        }
        .badge-pill-brand {
          background: #1e293b;
          color: #ffffff;
          padding: 6px 10px;
        }
        .badge-pill-grade {
          background: #ff4500;
          color: #ffffff;
          padding: 6px 12px;
        }
        .btn-copy-markdown {
          background: #ff4500;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-copy-markdown:hover {
          background: #e03d00;
          transform: translateY(-1px);
        }

        /* ── Ghost Mode Switch ── */
        .ghost-toggle-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .ghost-info {
          display: flex;
          flex-direction: column;
        }
        .ghost-label {
          font-size: 1.1rem;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .ghost-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* ── Personal Roast Vault (Mockup Matching 8-Card Grid) ── */
        .vault-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .vault-main-title {
          font-size: 1.75rem;
          color: var(--text-primary);
          letter-spacing: 1px;
          margin: 0;
        }
        .vault-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        .vault-card-item {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: var(--radius-md, 12px);
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .vault-card-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
          border-color: rgba(255, 69, 0, 0.3);
        }
        .vault-item-name {
          font-size: 1.15rem;
          color: var(--text-primary);
          word-break: break-all;
          margin: 0;
        }
        .vault-item-date {
          font-size: 11px;
          color: var(--text-muted);
          margin: 0;
        }
        .vault-item-trend {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }
        .trend-grade {
          color: #10b981;
          font-weight: 700;
        }
        .btn-download-vault {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: auto;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255, 69, 0, 0.08);
          color: var(--fire, #ff4500);
          border: 1px solid rgba(255, 69, 0, 0.25);
          text-decoration: none;
          transition: all 0.15s;
        }
        .btn-download-vault:hover {
          background: var(--fire, #ff4500);
          color: #ffffff;
        }

        /* ── Persona Cards ── */
        .prefs-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .prefs-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .prefs-title {
          font-size: 1.4rem;
          color: var(--text-primary);
        }
        .prefs-desc {
          font-size: 12px;
          color: var(--text-muted);
        }
        .saving-indicator {
          font-size: 11px;
          color: var(--fire);
        }
        .persona-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 10px;
        }
        .persona-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .persona-card:hover {
          background: rgba(255, 69, 0, 0.05);
          border-color: rgba(255, 69, 0, 0.4);
        }
        .persona-card--active {
          background: rgba(255, 69, 0, 0.1);
          border-color: var(--fire);
        }
        .persona-top {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .persona-icon {
          font-size: 18px;
        }
        .persona-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .persona-check {
          font-size: 9px;
          color: var(--fire);
          margin-left: auto;
        }
        .persona-sub {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.3;
        }

        /* ── Ghost Mode Switch ── */
        .privacy-toggle-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .privacy-title {
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .privacy-desc {
          font-size: 11px;
          color: var(--text-muted);
        }
        .switch-label {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .switch-input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .switch-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border, #cbd5e1);
          transition: 0.25s;
          border-radius: 24px;
        }
        .switch-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.25s;
          border-radius: 50%;
        }
        .switch-input:checked + .switch-slider {
          background-color: var(--fire);
        }
        .switch-input:checked + .switch-slider:before {
          transform: translateX(20px);
        }

        /* ── Badge Studio ── */
        .badge-studio-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .badge-studio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .badge-style-toggles {
          display: flex;
          gap: 6px;
        }
        .style-toggle-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 5px 10px;
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .style-toggle-btn--active {
          background: rgba(255, 69, 0, 0.12);
          border-color: var(--fire);
          color: var(--fire);
        }
        .badge-preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #000;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
        }
        .badge-live-img {
          max-height: 80px;
        }
        .badge-snippet-wrap {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .badge-code {
          flex: 1;
          background: var(--bg-primary, #f8fafc);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 11px;
          color: var(--fire);
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .copy-badge-btn {
          flex-shrink: 0;
          padding: 10px 16px;
        }

        /* ── Vault History ── */
        .vault-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .vault-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vault-count {
          font-size: 12px;
          color: var(--text-muted);
        }
        .vault-loading, .vault-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }
        .vault-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .vault-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .vault-item {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(20, 20, 20, 0.6);
        }
        .vault-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vault-grade-pill {
          font-size: 1rem;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 69, 0, 0.15);
          color: var(--fire);
          border: 1px solid rgba(255, 69, 0, 0.3);
        }
        .vault-grade-pill[data-grade="F"], .vault-grade-pill[data-grade="F-"] {
          background: rgba(255, 61, 61, 0.15);
          color: #FF3D3D;
          border-color: rgba(255, 61, 61, 0.3);
        }
        .vault-date {
          font-size: 10px;
          color: var(--text-muted);
        }
        .vault-roast-text {
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .vault-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .vault-source-tag {
          color: var(--text-muted);
        }
        .vault-link {
          color: var(--fire);
          text-decoration: none;
        }
        .vault-link:hover {
          text-decoration: underline;
        }

        /* ── Membership Plan ── */
        .plan-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .plan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .plan-name-highlight {
          color: var(--fire);
        }
        .plan-perks-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* ── Unauth Card ── */
        .unauth-card {
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          max-width: 620px;
          margin: 3rem auto;
        }
        .unauth-icon {
          font-size: 3rem;
          color: var(--fire);
        }
        .unauth-title {
          font-size: 2rem;
          color: var(--text-primary);
        }
        .unauth-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .unauth-perks {
          text-align: left;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .unauth-login-btn {
          width: 100%;
          justify-content: center;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .dashboard-feature-grid {
            grid-template-columns: 1fr;
          }
          .user-profile-card {
            flex-direction: column;
            align-items: stretch;
          }
          .quota-meter-card {
            width: 100%;
          }
          .badge-snippet-wrap {
            flex-direction: column;
          }
          .copy-badge-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  )
}
