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

  // ── Unauthenticated State View ────────────────────────────────
  if (!authLoading && !isLoggedIn) {
    return (
      <main className="dashboard-page">
        <div className="landing-glow animate-glow" />
        <div className="dashboard-container">
          <header className="dash-nav">
            <Link href="/" className="dash-logo font-display">GITROAST 🔥</Link>
            <div className="dash-nav-right">
              <SoundToggle />
              <Link href="/" className="dash-back-btn font-mono">← Home</Link>
            </div>
          </header>

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
        </div>
      </main>
    )
  }

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

        {/* ── User Profile Header Card ── */}
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
              <span className={`user-badge-tier user-badge-tier--${proPlan}`}>
                {isHistorian ? 'HISTORIAN 📜' : isPro ? 'ROASTER ⚡' : 'FREE'}
              </span>
            </div>
            <div className="user-profile-meta">
              <div className="user-name-row">
                <h1 className="user-handle font-display">@{user?.username}</h1>
                <span className="user-id-tag font-mono">ID: {user?.githubId || 'Active'}</span>
              </div>
              <p className="user-status-text font-mono">
                {isHistorian
                  ? '⭐ Lifetime Historian Tier — Unlimited Roasts, Zero Watermarks, Full Archive'
                  : isPro
                    ? '⚡ Pro Roaster Member — Unlimited Roasts, Gemini 2.5 Flash, HD Downloads'
                    : '🔥 Free Tier Member — 1 Roast Daily Quota, Dedicated 5,000 req/hr GitHub Token'}
              </p>
            </div>
          </div>

          <div className="user-profile-actions">
            <Link href={`/roast/${user?.username}`} className="btn btn--fire font-mono">
              ROAST MYSELF 🔥
            </Link>
            <Link href={`/history/${user?.username}`} className="btn btn--outline font-mono">
              PUBLIC REPORT ↗
            </Link>
          </div>
        </section>

        {/* ── Quota & Usage Meter ── */}
        <section className="quota-grid">
          <div className="card quota-card">
            <div className="quota-card-header font-mono">
              <span className="quota-label">DAILY ROAST QUOTA</span>
              <span className="quota-value font-display">
                {isPro ? 'UNLIMITED ⚡' : quotaData?.remaining != null ? `${quotaData.remaining} / 1 LEFT` : '1 / 1 LEFT'}
              </span>
            </div>
            <div className="quota-bar-track">
              <div
                className="quota-bar-fill"
                style={{ width: isPro ? '100%' : (quotaData?.remaining === 0 ? '0%' : '100%') }}
              />
            </div>
            <p className="quota-hint font-mono">
              {isPro
                ? 'Unlimited AI burns enabled. No daily cooldowns.'
                : 'Free users receive 1 roast daily. Resets at midnight UTC.'}
            </p>
          </div>

          <div className="card quota-card">
            <div className="quota-card-header font-mono">
              <span className="quota-label">API BURNS RECORDED</span>
              <span className="quota-value font-display">
                {user?.stats?.totalRoasts || historyRoasts.length || 0}
              </span>
            </div>
            <p className="quota-hint font-mono">
              Lifetime roasts archived in your personal GitRoast developer vault.
            </p>
          </div>
        </section>

        {/* ── Persona & Tone Settings ── */}
        <section className="card prefs-card">
          <div className="prefs-header">
            <div>
              <h2 className="prefs-title font-display">ROAST PERSONA & TONE</h2>
              <p className="prefs-desc font-mono">
                Choose the comedic lens through which your GitHub commits and code are roasted.
              </p>
            </div>
            {savingPrefs && <span className="saving-indicator font-mono">Saving…</span>}
          </div>

          <div className="persona-grid">
            {PERSONAS.map((p) => {
              const isSelected = currentPersona === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePersonaChange(p.key)}
                  className={`persona-card ${isSelected ? 'persona-card--active' : ''}`}
                  disabled={savingPrefs}
                >
                  <div className="persona-top">
                    <span className="persona-icon">{p.icon}</span>
                    <span className="persona-name font-mono">{p.name}</span>
                    {isSelected && <span className="persona-check font-mono">✓ ACTIVE</span>}
                  </div>
                  <p className="persona-sub">{p.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Ghost Mode Privacy Toggle */}
          <div className="privacy-toggle-box">
            <div className="privacy-toggle-left">
              <div className="privacy-title font-display">👻 GHOST MODE (WALL OF SHAME PRIVACY)</div>
              <p className="privacy-desc font-mono">
                When enabled, your profile and roast scores are strictly excluded from the public Wall of Shame leaderboard.
              </p>
            </div>
            <label className="switch-label">
              <input
                type="checkbox"
                checked={isGhostMode}
                onChange={handleGhostModeToggle}
                disabled={savingPrefs}
                className="switch-input"
                aria-label="Toggle Ghost Mode (Hide from public Wall of Shame leaderboard)"
              />
              <span className="switch-slider" />
            </label>
          </div>
        </section>

        {/* ── README Badge Studio ── */}
        <section className="card badge-studio-card">
          <div className="badge-studio-header">
            <div>
              <h2 className="prefs-title font-display">GITHUB PROFILE README BADGE</h2>
              <p className="prefs-desc font-mono">
                Embed your live, dynamic GitRoast score directly on your GitHub profile README.md.
              </p>
            </div>
            <div className="badge-style-toggles font-mono">
              <button
                type="button"
                className={`style-toggle-btn ${badgeStyle === 'standard' ? 'style-toggle-btn--active' : ''}`}
                onClick={() => { playClick(); setBadgeStyle('standard'); }}
              >
                Standard Card
              </button>
              <button
                type="button"
                className={`style-toggle-btn ${badgeStyle === 'shield' ? 'style-toggle-btn--active' : ''}`}
                onClick={() => { playClick(); setBadgeStyle('shield'); }}
              >
                Shield Pill
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="badge-preview-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/badge/${user?.username}${badgeStyle === 'shield' ? '?style=shield' : ''}`}
              alt={`@${user?.username}'s GitRoast Badge`}
              className="badge-live-img"
              loading="lazy"
            />
          </div>

          {/* Snippet Output */}
          <div className="badge-snippet-wrap">
            <pre className="badge-code font-mono">{badgeMarkdown}</pre>
            <button
              type="button"
              className="btn btn--fire copy-badge-btn font-mono"
              onClick={handleCopyBadge}
            >
              {copiedBadge ? 'COPIED! 📋' : 'COPY MARKDOWN 📋'}
            </button>
          </div>
        </section>

        {/* ── Personal Roast Vault (History) ── */}
        <section className="card vault-card">
          <div className="vault-header">
            <h2 className="prefs-title font-display">YOUR ROAST VAULT</h2>
            <span className="vault-count font-mono">{historyRoasts.length} RECORDED</span>
          </div>

          {historyLoading ? (
            <div className="vault-loading font-mono">Loading your roast archive…</div>
          ) : historyRoasts.length === 0 ? (
            <div className="vault-empty">
              <p className="vault-empty-text font-mono">
                You have not recorded any roasts yet. Generate your first burn to populate your vault!
              </p>
              <Link href={`/roast/${user?.username}`} className="btn btn--fire font-mono">
                GENERATE FIRST ROAST 🔥
              </Link>
            </div>
          ) : (
            <div className="vault-grid">
              {historyRoasts.map((r, i) => (
                <div key={r._id || i} className="vault-item card">
                  <div className="vault-item-top">
                    <div className="vault-grade-pill font-display" data-grade={r.grade}>
                      {r.grade} ({r.score}/100)
                    </div>
                    <span className="vault-date font-mono">
                      {new Date(r.createdAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="vault-roast-text font-mono">&ldquo;{r.roastText}&rdquo;</p>
                  <div className="vault-item-footer">
                    <span className="vault-source-tag font-mono">
                      {r.roastSource === 'ai' ? '⚡ AI Burn' : '🔥 Savage Rules'}
                      {r.persona && r.persona !== 'classic' ? ` • ${r.persona}` : ''}
                    </span>
                    <Link href={`/history/${r.username}`} className="vault-link font-mono">
                      View Report →
                    </Link>
                  </div>
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
          background: #262626;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
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
        .user-profile-actions {
          display: flex;
          gap: 10px;
        }

        /* ── Quota Grid ── */
        .quota-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .quota-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .quota-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .quota-label {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .quota-value {
          font-size: 1.5rem;
          color: var(--fire);
          line-height: 1;
        }
        .quota-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .quota-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF4500, #FFB700);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .quota-hint {
          font-size: 11px;
          color: var(--text-muted);
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
          background-color: #262626;
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
          background: #0A0A0A;
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
          .quota-grid {
            grid-template-columns: 1fr;
          }
          .user-profile-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .user-profile-actions {
            width: 100%;
          }
          .user-profile-actions :global(a) {
            flex: 1;
            text-align: center;
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
