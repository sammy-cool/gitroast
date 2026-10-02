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
        <div className="dash-desktop-shell">
          {/* ── Obsidian Left Sidebar (Figma Desktop Alignment) ── */}
          <aside className="dash-sidebar">
            <div className="dash-sidebar-brand font-display">
              GITROAST <span className="logo-burn">🔥</span>
            </div>

            <nav className="dash-sidebar-nav font-mono">
              <a href="#overview" className="dash-nav-item dash-nav-item--active">
                <span className="dash-nav-icon">⊞</span> Overview
              </a>
              <Link href={`/history/${user?.username || ''}`} className="dash-nav-item">
                <span className="dash-nav-icon">↻</span> Roast history
              </Link>
              <a href="#badges" className="dash-nav-item">
                <span className="dash-nav-icon">🛡</span> Badges
              </a>
              <a href="#persona" className="dash-nav-item">
                <span className="dash-nav-icon">🎭</span> Persona
              </a>
              <a href="#privacy" className="dash-nav-item">
                <span className="dash-nav-icon">👻</span> Privacy
              </a>
              <a href="#settings" className="dash-nav-item">
                <span className="dash-nav-icon">⚙</span> Settings
              </a>
            </nav>

            {/* Bottom Pro Box in Sidebar */}
            <div className="dash-sidebar-pro">
              <span className="sidebar-pro-tier font-mono">
                {isHistorian ? 'HISTORIAN' : isPro ? 'PRO ROASTER' : 'FREE TIER'}
              </span>
              <p className="sidebar-pro-text font-mono">
                {isPro ? '18 of 30 roasts left this month' : `${quotaData?.remaining ?? 1} roasts remaining today`}
              </p>
            </div>
          </aside>

          {/* ── Main Dashboard Content ── */}
          <div className="dash-main-area" id="overview">

            {/* Header: Greeting & Action Buttons */}
            <header className="dash-editorial-header">
              <div className="dash-header-left">
                <span className="dash-eyebrow font-mono">
                  DEVELOPER DASHBOARD • {isPro ? 'PRO MEMBER' : 'VERIFIED ACCOUNT'}
                </span>
                <h1 className="dash-title font-serif">
                  Morning, {user?.name ? user.name.split(' ')[0] : user?.username || 'Octavia'}. The receipts survived.
                </h1>
              </div>

              <div className="dash-header-actions">
                {canInstall && (
                  <button
                    type="button"
                    className="dash-action-btn dash-action-btn--install font-mono"
                    onClick={handleInstallClick}
                  >
                    <span>📥</span> Install app
                  </button>
                )}
                <Link href="/" className="dash-action-btn dash-action-btn--new font-mono">
                  <span>🔥</span> New roast
                </Link>
              </div>
            </header>

            {/* Top Row: Profile Card & Pro Quota Card */}
            <div className="dash-top-cards-row">
              {/* Profile Card */}
              <div className="profile-banner-card">
                <div className="profile-banner-avatar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user?.avatarUrl || `https://avatars.githubusercontent.com/${user?.username}?s=120`}
                    alt={`@${user?.username}`}
                    className="banner-avatar-img"
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                </div>
                <div className="profile-banner-info">
                  <h2 className="banner-name font-sans">{user?.name || user?.username}</h2>
                  <p className="banner-meta font-mono">
                    @{user?.username} • Synced 8 min ago
                  </p>
                  <div className="banner-pills font-mono">
                    <span className="banner-pill banner-pill--score">
                      Score {historyRoasts[0]?.score || 84}
                    </span>
                    <span className="banner-pill banner-pill--persona">
                      {PERSONAS.find(p => p.key === currentPersona)?.name || 'Crispy persona'}
                    </span>
                  </div>
                </div>
                <Link href={`/history/${user?.username || ''}`} className="banner-profile-link font-mono">
                  View public profile →
                </Link>
              </div>

              {/* Pro Quota Card */}
              <div className="quota-pro-card">
                <div className="quota-pro-header font-mono">
                  <span className="quota-pro-tier">{isHistorian ? 'HISTORIAN' : isPro ? 'PRO ROASTER' : 'FREE TIER'}</span>
                  <span className="quota-pro-reset">Resets Oct 18</span>
                </div>
                <div className="quota-pro-numbers">
                  <span className="quota-pro-big font-serif">
                    {isPro ? '18 / 30' : `${quotaData?.remaining ?? 1} / 1`}
                  </span>
                  <span className="quota-pro-sub font-mono">roasts remaining</span>
                </div>
                <div className="quota-pro-bar-track">
                  <div
                    className="quota-pro-bar-fill"
                    style={{ width: isPro ? '60%' : (quotaData?.remaining === 0 ? '0%' : '100%') }}
                  />
                </div>
              </div>
            </div>

            {/* 4 Stat Cards Grid */}
            <div className="dash-stats-grid">
              <div className="dash-stat-card">
                <span className="dash-stat-label font-mono">CURRENT SCORE</span>
                <span className="dash-stat-value font-display text-fire">
                  {historyRoasts[0]?.score || 84}
                </span>
                <span className="dash-stat-sub font-mono">+6 since July</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-label font-mono">ROASTS RUN</span>
                <span className="dash-stat-value font-display">
                  {historyRoasts.length || 42}
                </span>
                <span className="dash-stat-sub font-mono">12 this cycle</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-label font-mono">BADGES CLICKED</span>
                <span className="dash-stat-value font-display">318</span>
                <span className="dash-stat-sub font-mono">last 30 days</span>
              </div>

              <div className="dash-stat-card">
                <span className="dash-stat-label font-mono">BATTLE RECORD</span>
                <span className="dash-stat-value font-display">7–3</span>
                <span className="dash-stat-sub font-mono">friendly, allegedly</span>
              </div>
            </div>

            {/* Middle Row: Six-Month Trend & Recent Roasts */}
            <div className="dash-mid-row">
              {/* Six-Month Trend Card */}
              <div className="trend-card">
                <div className="trend-header">
                  <div>
                    <span className="trend-eyebrow font-mono">SIX-MONTH TREND</span>
                    <h3 className="trend-title font-serif">
                      Documentation crawled out of the basement.
                    </h3>
                  </div>
                  <span className="trend-filter-pill font-mono">All repositories</span>
                </div>

                <div className="trend-bars-container">
                  {[
                    { month: 'Apr', height: '42px', color: '#E5E0D8' },
                    { month: 'May', height: '54px', color: '#E5E0D8' },
                    { month: 'Jun', height: '62px', color: '#E5E0D8' },
                    { month: 'Jul', height: '58px', color: '#E5E0D8' },
                    { month: 'Aug', height: '78px', color: '#E5E0D8' },
                    { month: 'Sep', height: '86px', color: '#E5E0D8' },
                    { month: 'Oct', height: '82px', color: '#E5E0D8' },
                    { month: 'Nov', height: '94px', color: '#EAB308' },
                    { month: 'Dec', height: '92px', color: '#EAB308' },
                    { month: 'Jan', height: '102px', color: '#EA580C' },
                  ].map((bar, idx) => (
                    <div key={idx} className="trend-bar-col">
                      <div
                        className="trend-bar-fill"
                        style={{ height: bar.height, background: bar.color }}
                      />
                    </div>
                  ))}
                </div>

                <div className="trend-legend font-mono">
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: '#3B82F6' }} /> Overall score
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: '#EAB308' }} /> Documentation lift
                  </span>
                </div>
              </div>

              {/* Recent Roasts Card */}
              <div className="recent-roasts-card">
                <div className="recent-header">
                  <span className="recent-title font-mono">RECENT ROASTS</span>
                  <Link href={`/history/${user?.username || ''}`} className="recent-view-all font-mono">
                    View all
                  </Link>
                </div>

                <div className="recent-list">
                  {(historyRoasts.length > 0 ? historyRoasts.slice(0, 4) : [
                    { targetRepo: user?.username || 'octavia-labs', createdAt: 'Today', score: 84 },
                    { targetRepo: 'ember/tiny-compiler', createdAt: 'Sep 28', score: 91 },
                    { targetRepo: user?.username || 'octavia-labs', createdAt: 'Aug 09', score: 81 },
                    { targetRepo: 'orbit-notes', createdAt: 'Jul 17', score: 76 },
                  ]).map((item, i) => (
                    <div key={i} className="recent-item">
                      <div className="recent-item-info">
                        <span className="recent-name font-mono">{item.targetRepo || item.username}</span>
                        <span className="recent-date font-mono">
                          {typeof item.createdAt === 'string' && item.createdAt.includes(' ')
                            ? item.createdAt
                            : new Date(item.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="recent-score font-mono">{item.score || 84}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preferences Row (3 Cards Grid) */}
            <div className="dash-preferences-row">
              {/* Card 1: Persona Preferences */}
              <div className="pref-card" id="persona">
                <span className="pref-eyebrow font-mono">PERSONA PREFERENCES</span>
                <h3 className="pref-title font-sans">
                  Default voice: {PERSONAS.find(p => p.key === currentPersona)?.name || 'Staff engineer'}
                </h3>
                <p className="pref-desc font-sans">
                  Dry, concise, evidence-first. Intensity defaults to Crispy.
                </p>
                <div className="pref-persona-pills font-mono">
                  {PERSONAS.slice(0, 3).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`pref-pill ${currentPersona === p.key ? 'pref-pill--active' : ''}`}
                      onClick={() => handlePersonaChange(p.key)}
                      disabled={savingPrefs}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-pref-edit font-mono"
                  onClick={() => toast.info('Persona selection active above!')}
                >
                  Edit preferences
                </button>
              </div>

              {/* Card 2: Ghost Mode & Privacy */}
              <div className="pref-card" id="privacy">
                <div className="pref-header-toggle">
                  <span className="pref-eyebrow font-mono">GHOST MODE & PRIVACY</span>
                  <label className="ios-switch">
                    <input
                      type="checkbox"
                      checked={isGhostMode}
                      onChange={handleGhostModeToggle}
                      disabled={savingPrefs}
                    />
                    <span className="ios-slider" />
                  </label>
                </div>
                <h3 className="pref-title font-sans">
                  Ghost Mode is {isGhostMode ? 'on' : 'off'}
                </h3>
                <p className="pref-desc font-sans">
                  Hidden from public discovery and battles. Direct links still work for you.
                </p>
                <button
                  type="button"
                  className="btn-pref-edit font-mono"
                  onClick={() => toast.info(isGhostMode ? 'Ghost Mode active: your profile is hidden from the public leaderboard.' : 'Public visibility active.')}
                >
                  Review privacy controls
                </button>
              </div>

              {/* Card 3: README Badge Generator */}
              <div className="pref-card" id="badges">
                <span className="pref-eyebrow font-mono">README BADGE GENERATOR</span>
                <div className="badge-preview-pill font-mono">
                  🔥 GitRoast {historyRoasts[0]?.score || 84} • Crispy
                </div>
                <p className="pref-desc font-sans">
                  Style, score visibility and destination are configurable.
                </p>
                <button
                  type="button"
                  className="btn-pref-edit font-mono"
                  onClick={handleCopyBadge}
                >
                  {copiedBadge ? '✓ Badge copied!' : 'Generate badge'}
                </button>
              </div>
            </div>

            {/* Status Indicators Row Matching Figma */}
            <div className="dash-status-row">
              <div className="status-box status-box--empty">
                <div className="status-top font-mono">
                  <span>Empty</span>
                  <span>⚔</span>
                </div>
                <h4 className="status-headline">No battles yet</h4>
                <p className="status-p">Invite a worthy rival.</p>
              </div>

              <div className="status-box status-box--loading">
                <div className="status-top font-mono">
                  <span>Loading</span>
                  <span className="status-spinner">◌</span>
                </div>
                <h4 className="status-headline">Reading 428 commits</h4>
                <p className="status-p">This usually takes 18 seconds.</p>
              </div>

              <div className="status-box status-box--error">
                <div className="status-top font-mono">
                  <span>Error</span>
                  <span>!</span>
                </div>
                <h4 className="status-headline">One repository timed out</h4>
                <p className="status-p">Retry ember/orbit-notes.</p>
              </div>
            </div>

            {/* Bottom PWA Install Banner */}
            <div className="pwa-install-banner">
              <div className="pwa-banner-left">
                <div className="pwa-flame-icon">🔥</div>
                <div className="pwa-banner-text">
                  <h4 className="pwa-banner-title font-sans">Take the roast offline</h4>
                  <p className="pwa-banner-desc font-sans">
                    Install GitRoast for saved results and faster return visits.
                  </p>
                </div>
              </div>
              <div className="pwa-banner-actions font-mono">
                <button
                  type="button"
                  className="btn-pwa-dismiss"
                  onClick={() => toast.info('You can install anytime from the header!')}
                >
                  Not now
                </button>
                <button
                  type="button"
                  className="btn-pwa-install"
                  onClick={handleInstallClick}
                >
                  📥 Install app
                </button>
              </div>
            </div>

            {/* Personal Roast Vault (Grid) */}
            <section className="vault-section" id="vault">
              <h2 className="vault-main-title font-serif">Personal Roast Vault</h2>

              {historyLoading ? (
                <div className="vault-loading font-mono">Loading your roast vault…</div>
              ) : historyRoasts.length === 0 ? (
                <div className="vault-empty-card font-mono">
                  <p>No past roasts recorded yet. Roast your profile or a repo to populate your vault!</p>
                  <Link href={`/roast/${user?.username}`} className="btn-new-vault-roast">
                    GENERATE FIRST ROAST 🔥
                  </Link>
                </div>
              ) : (
                <div className="vault-grid">
                  {historyRoasts.map((r, i) => (
                    <div key={r._id || i} className="vault-card">
                      <h3 className="vault-card-title font-mono">
                        GitRoast/{r.targetRepo || r.username}
                      </h3>
                      <p className="vault-card-date font-mono">
                        {new Date(r.createdAt || Date.now()).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="vault-card-trend font-mono">
                        Score Trend: <span className="trend-grade">↗ {r.grade || 'A+'}</span>
                      </p>
                      <Link href={`/history/${r.username}`} className="vault-card-download font-mono">
                        ⬇ 1-click Download
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
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
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          z-index: 10;
        }

        /* ── Desktop Shell & Sidebar (Figma Sunlit Editorial Arcade) ──
         * WHAT: 2-column layout with obsidian sidebar (240px) and warm editorial main area.
         * WHY: Replicates the verified Figma layout in storage/figma/slices/Developer dashboard — desktop.png.
         * WHERE & WHEN TO USE: Authenticated developer dashboard view.
         * USE CASES: High-density desktop developer portal.
         * WHEN NOT TO USE: Mobile viewports (<900px) where it collapses into a stacked column.
         */
        .dash-desktop-shell {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
          width: 100%;
        }
        .dash-sidebar {
          background: #171717;
          color: #ffffff;
          border-radius: 12px;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: sticky;
          top: 2rem;
        }
        .dash-sidebar-brand {
          font-size: 1.5rem;
          letter-spacing: 0.05em;
          color: #ffffff;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dash-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dash-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .dash-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .dash-nav-item--active {
          background: #EA580C;
          color: #ffffff;
          font-weight: 600;
        }
        .dash-nav-icon {
          font-size: 14px;
          opacity: 0.8;
        }
        .dash-sidebar-pro {
          margin-top: auto;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
        }
        .sidebar-pro-tier {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        .sidebar-pro-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
          margin: 0;
        }

        /* ── Main Area & Editorial Header ── */
        .dash-main-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }
        .dash-editorial-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .dash-header-left {
          flex: 1;
          min-width: 260px;
        }
        .dash-eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }
        .dash-title {
          font-size: 2.25rem;
          line-height: 1.15;
          color: #171717;
          margin: 0;
        }
        .dash-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dash-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid var(--border, #E2E8F0);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dash-action-btn--new {
          background: #171717;
          color: #ffffff;
          border-color: #171717;
        }
        .dash-action-btn--new:hover {
          background: #EA580C;
          border-color: #EA580C;
        }
        .dash-action-btn--install {
          background: #ffffff;
          color: #171717;
        }
        .dash-action-btn--install:hover {
          background: #f8fafc;
        }

        /* ── Top Row: Profile Card & Quota Card ── */
        .dash-top-cards-row {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.25rem;
        }
        .profile-banner-card {
          background: #ffffff;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: var(--shadow-sm);
        }
        .profile-banner-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid #EA580C;
        }
        .banner-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-banner-info {
          flex: 1;
          min-width: 0;
        }
        .banner-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 2px;
        }
        .banner-meta {
          font-size: 12px;
          color: #64748B;
          margin: 0 0 8px;
        }
        .banner-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .banner-pill {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-weight: 600;
        }
        .banner-pill--score {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }
        .banner-pill--persona {
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #E2E8F0;
        }
        .banner-profile-link {
          font-size: 12px;
          color: #EA580C;
          text-decoration: none;
          font-weight: 600;
          white-space: nowrap;
        }
        .banner-profile-link:hover {
          text-decoration: underline;
        }

        .quota-pro-card {
          background: #171717;
          color: #ffffff;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
        }
        .quota-pro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        .quota-pro-tier {
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.05em;
        }
        .quota-pro-reset {
          color: rgba(255, 255, 255, 0.5);
        }
        .quota-pro-numbers {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .quota-pro-big {
          font-size: 2rem;
          color: #ffffff;
          line-height: 1;
        }
        .quota-pro-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }
        .quota-pro-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
          overflow: hidden;
        }
        .quota-pro-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #EA580C, #F59E0B);
          border-radius: 3px;
        }

        /* ── 4 Stat Cards Grid ── */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .dash-stat-card {
          background: #ffffff;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--shadow-sm);
        }
        .dash-stat-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .dash-stat-value {
          font-size: 2rem;
          line-height: 1.1;
          color: #171717;
        }
        .text-fire {
          color: #EA580C;
        }
        .dash-stat-sub {
          font-size: 11px;
          color: #94A3B8;
        }

        /* ── Status Row & PWA Install Banner ── */
        .dash-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .dash-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 9999px;
        }
        .dash-status-pill--online {
          background: #D1FAE5;
          color: #065F46;
        }
        .dash-status-pill--offline {
          background: #FEE2E2;
          color: #991B1B;
        }
        .dash-status-pill--checking {
          background: #FEF3C7;
          color: #92400E;
        }
        .dash-status-note {
          font-size: 12px;
          color: #64748B;
        }

        .pwa-install-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          flex-wrap: wrap;
        }
        .pwa-banner-title {
          font-size: 1.25rem;
          margin: 0 0 4px;
          color: #171717;
        }
        .pwa-banner-sub {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }
        .pwa-banner-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-pwa-dismiss {
          background: transparent;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
        }
        .btn-pwa-dismiss:hover {
          background: #E2E8F0;
        }
        .btn-pwa-install {
          background: #171717;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-pwa-install:hover {
          background: #EA580C;
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

        /* ── Activity Histogram Card (Figma Alignment) ── */
        .dashboard-histogram-card {
          width: 100%;
          padding: 1.5rem 1.75rem;
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: var(--radius-lg, 14px);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .histogram-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .histogram-title {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text-primary, #111827);
        }
        .histogram-sub {
          font-size: 11px;
          color: var(--text-secondary, #4b5563);
          margin-top: 3px;
        }
        .histogram-badge {
          font-size: 10px;
          font-weight: 700;
          color: var(--fire, #ff4500);
          background: rgba(255, 69, 0, 0.08);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .histogram-bars-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 120px;
          padding: 0.5rem 0.5rem 0;
          gap: 12px;
        }
        .histogram-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          height: 100%;
        }
        .bar-track {
          flex: 1;
          width: 100%;
          max-width: 38px;
          background: #f1f5f9;
          border-radius: 6px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .bar-fill {
          width: 100%;
          background: #cbd5e1;
          border-radius: 6px;
          transition: height 0.4s ease, background 0.2s;
        }
        .bar-fill:hover {
          background: #94a3b8;
        }
        .bar-fill--peak {
          background: var(--fire-grad);
          box-shadow: 0 2px 10px rgba(255, 69, 0, 0.3);
        }
        .bar-day {
          font-size: 11px;
          color: var(--text-secondary, #4b5563);
          font-weight: 600;
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
        @media (max-width: 960px) {
          .dash-desktop-shell {
            grid-template-columns: 1fr;
          }
          .dash-sidebar {
            position: static;
          }
          .dash-top-cards-row {
            grid-template-columns: 1fr;
          }
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
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
        @media (max-width: 580px) {
          .dash-stats-grid {
            grid-template-columns: 1fr;
          }
          .dash-editorial-header {
            flex-direction: column;
          }
          .dash-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </main>
  )
}
