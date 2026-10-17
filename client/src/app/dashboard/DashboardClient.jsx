'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getRoastHistory, getRateLimitStatus } from '@/services/roastService'
import { toast, notify } from '@/utils/toast'
import { playClick } from '@/utils/soundFX'
import { promptPWAInstall, isPWAInstallable } from '@/components/PWARegister'
import Logo from '@/components/Logo'
import Icon from '@/components/Icon'
import { PERSONAS, personaLabel, intensityLabel, normalizePersona } from '@/utils/vocab'
import { badgeMarkdown as buildBadge } from '@/hooks/useRoastShare'
import './dashboard.css'

const NAV = [
  { href: '#overview', label: 'Overview', icon: 'home' },
  { href: '#history', label: 'Roast history', icon: 'list' },
  { href: '#badges', label: 'Badges', icon: 'bookmark' },
  { href: '#persona', label: 'Persona', icon: 'flame' },
  { href: '#privacy', label: 'Privacy', icon: 'shield' },
]

function Pill({ score }) {
  return <span className="gr-pill gr-pill--ember">{score}</span>
}

export default function DashboardClient() {
  const router = useRouter()
  const { user, loading: authLoading, isLoggedIn, isPro, proPlan, loginWithGitHub, updatePreferences, getToken, logout } = useAuth()

  const [quota, setQuota] = useState(null)
  const [history, setHistory] = useState([])
  const [historyState, setHistoryState] = useState('loading')
  const [saving, setSaving] = useState(false)
  const [badgeStyle, setBadgeStyle] = useState('card')
  const [canInstall, setCanInstall] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (user?.role === 'recruiter') router.replace('/recruiter')
  }, [user, router])

  useEffect(() => {
    setCanInstall(isPWAInstallable())
    const onInstallable = (e) => setCanInstall(Boolean(e.detail?.available))
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener('gitroast-installable', onInstallable)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    try { setInstallDismissed(localStorage.getItem('gitroast_install_dismissed') === '1') } catch {}
    return () => {
      window.removeEventListener('gitroast-installable', onInstallable)
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  const loadHistory = useCallback(() => {
    if (!user) return () => {}
    let cancelled = false
    setHistoryState('loading')
    getRateLimitStatus(getToken ? getToken() : null).then((q) => !cancelled && q && setQuota(q)).catch(() => {})
    getRoastHistory(user.username)
      .then((res) => {
        if (cancelled) return
        setHistory(res?.history || res?.roasts || [])
        setHistoryState('ready')
      })
      .catch(() => !cancelled && setHistoryState('error'))
    return () => { cancelled = true }
  }, [user, getToken])

  useEffect(() => loadHistory(), [loadHistory])

  const handlePersona = useCallback(async (key) => {
    playClick()
    setSaving(true)
    try {
      await updatePreferences({ defaultPersona: key })
      toast.success('Default voice updated', { description: `${personaLabel(key)} will narrate your next roast.` })
    } catch {
      toast.error('Could not update your persona', { description: 'Nothing was changed. Try again.' })
    } finally {
      setSaving(false)
    }
  }, [updatePreferences])

  const handleGhost = useCallback(async (e) => {
    playClick()
    const hidden = e.target.checked
    setSaving(true)
    try {
      await updatePreferences({ hideFromLeaderboard: hidden })
      if (hidden) notify.ghostModeOn({ onAction: () => document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' }) })
      else toast.success('Discovery restored', { description: 'Your public profile can appear on the Wall of Shame again.' })
    } catch {
      toast.error('Could not update privacy settings', { description: 'Nothing was changed. Try again.' })
    } finally {
      setSaving(false)
    }
  }, [updatePreferences])

  const markdown = useMemo(() => (user ? buildBadge(user.username, badgeStyle) : ''), [user, badgeStyle])

  const copyBadge = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(() => notify.copied({ what: 'README badge Markdown' })).catch(() => toast.error('Could not copy the badge code'))
  }, [markdown])

  const install = useCallback(async () => {
    playClick()
    if (await promptPWAInstall()) {
      toast.success('GitRoast installed', { description: 'Open it from your home screen.' })
      setCanInstall(false)
    }
  }, [])

  const dismissInstall = () => {
    setInstallDismissed(true)
    try { localStorage.setItem('gitroast_install_dismissed', '1') } catch {}
  }

  /* ── Signed-out state ── */
  if (!authLoading && !isLoggedIn) {
    return (
      <main className="dash-signed-out">
        <div className="gr-card dash-gate">
          <Logo />
          <p className="gr-eyebrow">Developer dashboard</p>
          <h1 className="gr-h2">Your roast history, in one place.</h1>
          <p className="gr-lede">Connect GitHub to see your history, manage quota, generate README badges and control privacy.</p>
          <ul className="dash-gate__list">
            <li>Dedicated 5,000 req/hr GitHub API quota</li>
            <li>Personal roast history and certificates</li>
            <li>One-click README badges</li>
            <li>Ghost Mode privacy toggle</li>
          </ul>
          <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={loginWithGitHub}>Continue with GitHub</button>
          <Link href="/auth?role=recruiter" className="gr-btn gr-btn--quiet">I&apos;m a recruiter</Link>
        </div>
      </main>
    )
  }

  if (authLoading || !user) return <div className="rc-loading" role="status">Opening your dashboard…</div>

  const persona = normalizePersona(user.customPreferences?.defaultPersona)
  const ghost = Boolean(user.customPreferences?.hideFromLeaderboard)
  const latest = history[0]
  const aiQuota = quota?.aiQuota
  const stats = user.stats || {}
  const first = user.username

  return (
    <div className="gr-shell dash">
      <aside className="gr-side" aria-label="Dashboard navigation">
        <Logo dark />
        <nav className="rc-nav">
          {NAV.map((n, i) => (
            <a key={n.href} href={n.href} className="gr-side__link" aria-current={i === 0 ? 'page' : undefined}>
              <Icon name={n.icon} /> {n.label}
            </a>
          ))}
          <Link href="/leaderboard" className="gr-side__link"><Icon name="users" /> Wall of Shame</Link>
        </nav>
        <div className="rc-side-foot">
          <p className="rc-org">{isPro ? proPlan === 'historian' ? 'Historian' : 'Pro Roaster' : 'Free plan'}</p>
          <button type="button" className="gr-side__link rc-logout" onClick={async () => { await logout(); router.push('/') }}><Icon name="logout" /> Sign out</button>
        </div>
      </aside>

      <main className="gr-main dash-main">
        <header className="dash-head" id="overview">
          <div>
            <p className="gr-eyebrow">Developer dashboard</p>
            <h1 className="gr-h1 dash-title">Morning, {first}. The receipts survived.</h1>
          </div>
          <div className="rc-head__actions">
            {canInstall && <button type="button" className="gr-btn gr-btn--outline" onClick={install}>Install app</button>}
            <Link href={`/roast/${user.username}`} className="gr-btn gr-btn--primary"><Icon name="flame" /> New roast</Link>
          </div>
        </header>

        {offline && <div className="gr-state dash-offline" role="status"><span className="gr-state__tag">Offline</span><p className="gr-state__title">Showing saved history</p><p className="gr-help">Fresh analysis waits for a connection.</p></div>}

        <div className="dash-top">
          <section className="gr-card dash-id">
            <span className="rc-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
              {user.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.avatarUrl} alt="" width={64} height={64} style={{ borderRadius: '50%' }} /> : user.username.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h2 className="dash-id__name">{user.displayName || user.username}</h2>
              <p className="gr-mono dash-id__meta">@{user.username}</p>
              <div className="rc-chips">
                {latest && <span className="gr-pill gr-pill--ember">Score {latest.score}</span>}
                <span className="gr-pill gr-pill--blue">{personaLabel(persona)} persona</span>
              </div>
            </div>
            <Link href={`/history/${user.username}`} className="rc-link dash-id__link">View public profile</Link>
          </section>

          <section className="gr-card gr-card--dark dash-quota" aria-label="Roast quota">
            <span className="gr-eyebrow dash-gold">{isPro ? (proPlan === 'historian' ? 'Historian' : 'Pro Roaster') : 'Free plan'} • AI roasts</span>
            <p className="dash-quota__big">{aiQuota ? (aiQuota.unlimited ? 'Unlimited' : `${aiQuota.remaining} / ${aiQuota.limit}`) : '—'}</p>
            <p className="dash-quota__sub">
              {aiQuota
                ? aiQuota.exhausted
                  ? `Used up. Rules-engine roasts continue; AI resets ${new Date(aiQuota.resetsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
                  : `Resets ${new Date(aiQuota.resetsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : 'Loading allowance'}
            </p>
            <div className="gr-meter__track dash-quota__track"><div className="gr-meter__fill" style={{ width: aiQuota && !aiQuota.unlimited ? `${Math.round((aiQuota.remaining / aiQuota.limit) * 100)}%` : '100%' }} /></div>
          </section>
        </div>

        <section className="dash-stats" aria-label="Summary">
          {[
            ['Current score', latest ? latest.score : '—', latest ? 'From your latest roast' : 'Run your first roast'],
            ['Roasts run', stats.totalRoasts ?? history.length, `${history.length} in your vault`],
            ['Reactions received', stats.reactionsReceived ?? 0, 'On your public roasts'],
            ['Battle record', `${stats.battlesWon ?? 0}–${stats.battlesLost ?? 0}`, 'friendly, allegedly'],
          ].map(([k, v, s]) => (
            <div key={k} className="gr-card rc-stat"><span className="gr-eyebrow rc-stat__k">{k}</span><b className="rc-stat__v">{v}</b><span className="gr-help">{s}</span></div>
          ))}
        </section>

        <div className="dash-cols">
          <section className="gr-card" id="history" aria-labelledby="dh-h">
            <div className="rc-table-head dash-pad0">
              <div><p className="gr-eyebrow">Recent roasts</p><h2 id="dh-h" className="gr-h3">Your history</h2></div>
              <Link href={`/history/${user.username}`} className="rc-link">View all</Link>
            </div>
            {historyState === 'loading' && <div className="gr-state gr-state--loading"><span className="gr-state__tag">Loading</span><p className="gr-state__title">Reading your archive</p></div>}
            {historyState === 'error' && <div className="gr-state gr-state--error" role="alert"><span className="gr-state__tag">Error</span><p className="gr-state__title">History is unavailable</p><button type="button" className="gr-btn gr-btn--outline" onClick={loadHistory}>Retry</button></div>}
            {historyState === 'ready' && history.length === 0 && <div className="gr-state"><span className="gr-state__tag">Empty</span><p className="gr-state__title">No ashes yet</p><p className="gr-help">Run your first roast to start a history.</p><Link href={`/roast/${user.username}`} className="gr-btn gr-btn--primary">Roast myself</Link></div>}
            {historyState === 'ready' && history.length > 0 && (
              <ul className="dash-history">
                {history.slice(0, 8).map((r, i) => (
                  <li key={r._id || i}>
                    <Link href={`/history/${user.username}`}>
                      <span><b>{r.targetName || r.username || user.username}</b><small className="gr-mono">{new Date(r.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {intensityLabel(r.intensity)} • {personaLabel(r.persona)}</small></span>
                      <Pill score={r.score} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="dash-stack">
            <section className="gr-card" id="persona" aria-labelledby="dp-h">
              <p className="gr-eyebrow">Persona preferences</p>
              <h2 id="dp-h" className="gr-h3">Default voice: {personaLabel(persona)}</h2>
              <p className="gr-help">Intensity defaults to Crispy. Change it per roast on the home screen.</p>
              <div className="rc-chips" role="radiogroup" aria-label="Default persona">
                {PERSONAS.map((p) => (
                  <button key={p.key} type="button" role="radio" aria-checked={persona === p.key} className="gr-chip" aria-pressed={persona === p.key} disabled={saving} onClick={() => handlePersona(p.key)}>{p.label}</button>
                ))}
              </div>
            </section>

            <section className={`gr-card ${ghost ? 'gr-card--mint' : ''}`} id="privacy" aria-labelledby="dg-h">
              <div className="dash-toggle">
                <div>
                  <p className="gr-eyebrow">Ghost Mode & privacy</p>
                  <h2 id="dg-h" className="gr-h3">Ghost Mode is {ghost ? 'on' : 'off'}</h2>
                </div>
                <label className="dash-switch">
                  <input type="checkbox" checked={ghost} onChange={handleGhost} disabled={saving} aria-label="Ghost Mode" />
                  <span aria-hidden="true" />
                </label>
              </div>
              <p className="gr-help">{ghost ? 'Hidden from public discovery and battles. Direct links still work for you.' : 'Your public profile can appear on the Wall of Shame. Turn on to hide it.'}</p>
            </section>

            <section className="gr-card" id="badges" aria-labelledby="db-h">
              <p className="gr-eyebrow">README badge generator</p>
              <h2 id="db-h" className="gr-h3">Wear the evidence</h2>
              <div className="dash-badge">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/api/badge/${user.username}${badgeStyle === 'shield' ? '?style=shield' : ''}`} alt={`@${user.username} GitRoast badge`} loading="lazy" /></div>
              <div className="gr-seg" role="tablist" aria-label="Badge style">
                {['card', 'shield'].map((s) => <button key={s} type="button" role="tab" aria-selected={badgeStyle === s} onClick={() => setBadgeStyle(s)}>{s === 'card' ? 'Card' : 'Shield'}</button>)}
              </div>
              <code className="gr-mono rr-code">{markdown}</code>
              <button type="button" className="gr-btn gr-btn--outline gr-btn--block" onClick={copyBadge}>Generate badge</button>
            </section>
          </div>
        </div>

        {canInstall && !installDismissed && (
          <section className="gr-card gr-card--gold dash-install">
            <span className="dash-install__mark"><Icon name="flame" size={22} /></span>
            <div><p className="dash-install__t">Take the roast offline</p><p className="gr-help">Install GitRoast for saved results and faster return visits.</p></div>
            <div className="rc-actions">
              <button type="button" className="gr-btn gr-btn--quiet" onClick={dismissInstall}>Not now</button>
              <button type="button" className="gr-btn gr-btn--dark" onClick={install}>Install app</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
