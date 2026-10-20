'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { toast } from '@/utils/toast'
import Icon from '@/components/Icon'
import RoastReactions from './RoastReactions'
import { trackView, getRoastHistory } from '@/services/roastService'
import TrendBars from '@/components/TrendBars'
import useRoastShare, { badgeMarkdown } from '@/hooks/useRoastShare'
import { intensityLabel, personaLabel } from '@/utils/vocab'
import dynamic from 'next/dynamic'
import './roast-result.css'

const RoastCertificate = dynamic(() => import('./RoastCertificate'), { ssr: false })
const GitHubWrapped = dynamic(() => import('./GitHubWrapped'), { ssr: false })

const TYPING_SPEED = 18
const ANATOMY = [
  { key: 'depth', label: 'Project depth', tone: '' },
  { key: 'consistency', label: 'Consistency', tone: 'gold' },
  { key: 'collaboration', label: 'Collaboration', tone: 'mint' },
  { key: 'documentation', label: 'Documentation', tone: 'blue' },
]

function firstSentence(text = '') {
  const m = text.match(/^[\s\S]*?[.!?](?=\s|$)/)
  return (m ? m[0] : text).trim()
}

function Meter({ label, signal, tone }) {
  const has = signal && typeof signal.value === 'number'
  return (
    <div className="gr-meter">
      <div className="gr-meter__head"><span>{label}</span><b>{has ? signal.value : '—'}</b></div>
      <div className="gr-meter__track" role="img" aria-label={has ? `${label} ${signal.value} out of 100` : `${label}: not enough public evidence`}>
        <div className={`gr-meter__fill${tone ? ` gr-meter__fill--${tone}` : ''}`} style={{ width: has ? `${signal.value}%` : '0%' }} />
      </div>
    </div>
  )
}

export default function RoastCard({ data, onProClick, onRoastAnother, historyHref }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [badgeStyle, setBadgeStyle] = useState('card')
  const [pastRoasts, setPastRoasts] = useState([])
  const intervalRef = useRef(null)

  const roastText = data?.roast || ''
  const roastTargetId = data?.roastId || data?._id

  const share = useRoastShare({
    username: data?.username,
    roastId: roastTargetId,
    roastText,
    isPro: data?.isPro,
    onProClick,
  })

  useEffect(() => {
    if (roastTargetId) trackView(roastTargetId)
  }, [roastTargetId])

  // Score history for "History comparison" (public roasts only; silent if unavailable).
  useEffect(() => {
    if (!data?.username) return undefined
    let alive = true
    getRoastHistory(data.username)
      .then((res) => alive && setPastRoasts(res?.history || res?.roasts || []))
      .catch(() => {})
    return () => { alive = false }
  }, [data?.username])

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  // Typing effect. Reduced-motion users get the full text immediately.
  useEffect(() => {
    setDisplayedText('')
    setTypingDone(false)
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !roastText) {
      setDisplayedText(roastText)
      setTypingDone(true)
      return undefined
    }
    let i = 0
    intervalRef.current = setInterval(() => {
      i += 1
      setDisplayedText(roastText.slice(0, i))
      if (i >= roastText.length) {
        clearInterval(intervalRef.current)
        setTypingDone(true)
      }
    }, TYPING_SPEED)
    return () => clearInterval(intervalRef.current)
  }, [roastText])

  function handleVoiceRoast() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.warning('Voice is not supported here', { description: 'Try a different browser or device.' })
      return
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(roastText)
    utterance.rate = 0.92
    utterance.pitch = 0.88
    const voices = window.speechSynthesis.getVoices()
    const voice =
      voices.find((v) => v.lang.startsWith('en') && /Google|Natural|UK|Daniel|Aaron/.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en'))
    if (voice) utterance.voice = voice
    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    window.speechSynthesis.speak(utterance)
  }

  const headline = useMemo(() => firstSentence(roastText), [roastText])
  if (!data) return null

  const stats = Array.isArray(data.stats) ? data.stats : []
  const commits = Array.isArray(data.shameCommits) ? data.shameCommits : []
  const signals = data.anatomy?.signals || {}
  const hasAnatomy = Object.keys(signals).length > 0
  const plan = Array.isArray(data.redemptionPlan) ? data.redemptionPlan : []
  const roastId = roastTargetId
  const recentPast = [...pastRoasts].slice(0, 8).reverse()
  const historyValues = recentPast.map((r) => r.score).filter((v) => typeof v === 'number')
  const historyLabels = recentPast.map((r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short' }) : ''))
  const historyDelta = historyValues.length >= 2 ? historyValues[historyValues.length - 1] - historyValues[0] : 0
  const badgeSrc = badgeStyle === 'shield' ? `/api/badge/${data.username}?style=shield` : `/api/badge/${data.username}`

  return (
    <div className="rr">
      {/* ── Hero (this block is what "Download card" captures) ── */}
      <div id="roast-card-capture" className="rr-capture">
        <section className="rr-hero" aria-label="Roast summary">
          <div className="rr-hero__top">
            <div className="rr-id">
              <span className="rr-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.avatarUrl || `https://avatars.githubusercontent.com/${data.username}?s=96`}
                  alt=""
                  crossOrigin="anonymous"
                  width={56}
                  height={56}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <b aria-hidden="true">{data.username?.slice(0, 2).toUpperCase()}</b>
              </span>
              <div>
                <p className="rr-name">{data.username}</p>
                <p className="rr-meta">
                  Public profile • Member since {data.joinYear} • {data.totalRepos} repos
                </p>
              </div>
            </div>
          </div>

          <div className="rr-hero__body">
            <div>
              <p className="rr-tags">
                {intensityLabel(data.intensity)} • {personaLabel(data.persona)} persona
                {data.roastSource === 'ai' ? ' • AI' : ''}
              </p>
              <h1 className="rr-quote">&ldquo;{headline}&rdquo;</h1>
              <p className="rr-sub">Grade {data.grade}. Humor does not affect the score — it is built from public signals only.</p>
            </div>
            <div className="gr-score rr-score" role="img" aria-label={`Roast score ${data.score} out of 100`}>
              <b>{data.score}</b>
              <small>Roast score / 100</small>
            </div>
          </div>
          <p className="rr-brand">gitroast.dev</p>
        </section>
      </div>

      {/* Hero actions (outside capture so they never render into the PNG) */}
      <div className="rr-actions">
        <button type="button" className="gr-btn gr-btn--primary" onClick={share.shareLink}><Icon name="share" /> Share the pain</button>
        <button type="button" className="gr-btn gr-btn--outline" onClick={share.download} disabled={share.downloading}>{share.downloading ? 'Rendering…' : 'Download card'}</button>
        <button type="button" className="gr-btn gr-btn--outline" onClick={() => document.getElementById('rr-badge')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Add badge</button>
        <button type="button" className="gr-btn gr-btn--quiet" onClick={share.shareX}>Share on X</button>
        {historyHref && <Link href={historyHref} className="gr-btn gr-btn--quiet">History</Link>}
        {onRoastAnother && <button type="button" className="gr-btn gr-btn--quiet" onClick={onRoastAnother}>Roast another</button>}
      </div>

      {/* Evidence signals (design: four metric cards) */}
      {hasAnatomy && (
        <section className="rr-metrics" aria-label="Evidence signals">
          {[
            ['Project depth', 'depth', `${data.totalRepos ?? 0} public repositories`],
            ['Consistency', 'consistency', 'Commit message quality'],
            ['Collaboration', 'collaboration', data.collab ? `${(data.collab.prs || 0) + (data.collab.reviews || 0)} public PRs and reviews` : 'Needs public PR data'],
            ['Documentation', 'documentation', 'README and maintained repositories'],
          ].map(([label, key, note]) => {
            const v = signals[key]?.value
            return (
              <div key={key} className="gr-card rr-metric">
                <span className="gr-eyebrow rr-metric__k">{label}</span>
                <b className={`rr-metric__v${typeof v === 'number' && v < 60 ? ' rr-metric__v--bad' : ''}`}>{typeof v === 'number' ? v : '—'}</b>
                <span className="gr-help">{typeof v === 'number' ? note : 'Insufficient public evidence'}</span>
              </div>
            )
          })}
        </section>
      )}

      {/* Roast stats */}
      {stats.length > 0 && (
        <section className="rr-metrics" aria-label="Key metrics">
          {stats.map((s) => (
            <div key={s.label} className="gr-card rr-metric">
              <span className="gr-eyebrow rr-metric__k">{s.label}</span>
              <b className={`rr-metric__v${s.bad ? ' rr-metric__v--bad' : ''}`}>{s.value}</b>
              <span className="gr-help">{s.note}</span>
            </div>
          ))}
        </section>
      )}

      <div className="rr-cols">
        <div className="rr-main">
          {/* The roast, typed */}
          <section className="gr-card rr-roast" aria-labelledby="rr-roast-h">
            <div className="rr-roast__head">
              <div>
                <p className="gr-eyebrow">The roast</p>
                <h2 id="rr-roast-h" className="gr-h3">Full read-out</h2>
              </div>
              {typingDone && (
                <button type="button" className="gr-btn gr-btn--outline" aria-pressed={isPlayingAudio} onClick={handleVoiceRoast}>
                  {isPlayingAudio ? 'Stop voice' : 'Voice roast'}
                </button>
              )}
            </div>
            <p className="rr-roast__text" aria-live="off">
              {displayedText}
              {!typingDone && <span className="rr-caret" aria-hidden="true" />}
            </p>
            {typingDone && <button type="button" className="gr-btn gr-btn--quiet" onClick={share.copyText}>Copy roast text</button>}
          </section>

          {/* Charges / receipts */}
          {(commits.length > 0 || data.bioContrast?.reality) && (
            <section aria-labelledby="rr-charges-h" className="rr-charges">
              <p className="gr-eyebrow">The charges</p>
              <h2 id="rr-charges-h" className="gr-h2">Developer sins, with receipts.</h2>
              {commits.length > 0 && (
                <article className="gr-card rr-charge">
                  <div className="rr-charge__head">
                    <h3>Commit confetti</h3>
                    <span className="gr-pill gr-pill--blue">{commits.length} recent commits</span>
                  </div>
                  <ul className="rr-commits">
                    {commits.map((m, i) => <li key={i} className="gr-mono">&ldquo;{m}&rdquo;</li>)}
                  </ul>
                  <a className="rr-evidence" href={`https://github.com/${data.username}`} target="_blank" rel="noopener noreferrer">Inspect public evidence →</a>
                </article>
              )}
              {data.bioContrast?.reality && (
                <article className="gr-card gr-card--ember rr-charge">
                  <div className="rr-charge__head">
                    <h3>Bio vs reality</h3>
                    <span className="gr-pill gr-pill--ember">Resume claim vs git truth</span>
                  </div>
                  <p><b>Claimed:</b> &ldquo;{data.bioContrast.claimed}&rdquo;</p>
                  <p><b>Hard truth:</b> {data.bioContrast.reality}</p>
                  {data.bioContrast.verdict && <p className="rr-verdict">{data.bioContrast.verdict}</p>}
                </article>
              )}
            </section>
          )}

          {data.repoHighlight && (
            <section className="gr-card rr-highlight" aria-labelledby="rr-hl-h">
              <div className="rr-highlight__top">
                <p className="gr-eyebrow">Repository highlight</p>
                <span className="gr-pill gr-pill--mint">Best evidence</span>
              </div>
              <h2 id="rr-hl-h" className="rr-highlight__name">
                <a href={`https://github.com/${data.username}/${data.repoHighlight.name}`} target="_blank" rel="noopener noreferrer">{data.username} / {data.repoHighlight.name}</a>
              </h2>
              <blockquote className="rr-highlight__quote">&ldquo;{data.repoHighlight.quote}&rdquo;</blockquote>
              <dl className="rr-highlight__stats">
                <div><dt>Stars</dt><dd>{data.repoHighlight.stars.toLocaleString()}</dd><small>Public signal, not score input</small></div>
                <div>
                  <dt>Momentum</dt>
                  <dd>{data.repoHighlight.momentum?.pct != null ? `${data.repoHighlight.momentum.pct > 0 ? '+' : ''}${data.repoHighlight.momentum.pct}%` : data.repoHighlight.forks.toLocaleString()}</dd>
                  <small>{data.repoHighlight.momentum ? `Commits, last 13 weeks vs prior 13 (${data.repoHighlight.momentum.last13} vs ${data.repoHighlight.momentum.prior13})` : `Forks • ${data.repoHighlight.language || 'mixed languages'}`}</small>
                </div>
                <div><dt>Last push</dt><dd>{data.repoHighlight.daysSincePush === null ? '—' : data.repoHighlight.daysSincePush === 0 ? 'Today' : `${data.repoHighlight.daysSincePush}d ago`}</dd><small>{data.repoHighlight.openIssues} open issues</small></div>
              </dl>
            </section>
          )}

          {historyValues.length >= 2 && (
            <section className="gr-card" aria-labelledby="rr-hist-h">
              <p className="gr-eyebrow">History comparison</p>
              <h2 id="rr-hist-h" className="gr-h3">{historyDelta > 0 ? 'Less chaos. Better score.' : historyDelta < 0 ? 'A bumpier stretch. Room to recover.' : 'Steady. Same Tuesday.'}</h2>
              <TrendBars values={historyValues} labels={historyLabels} ariaLabel="Score history" caption="Score trend • same methodology version • public data" />
            </section>
          )}

          {typingDone && plan.length > 0 && (
            <section className="gr-card gr-card--gold" aria-labelledby="rr-plan-h">
              <p className="gr-eyebrow">AI action items</p>
              <h2 id="rr-plan-h" className="gr-h3">Architect redemption plan</h2>
              <ol className="rr-plan">
                {plan.map((item, i) => <li key={i}><span className="gr-mono">0{i + 1}</span>{item}</li>)}
              </ol>
            </section>
          )}

          {typingDone && roastId && (
            <section className="gr-card"><RoastReactions roastId={roastId} initialReactions={data.reactions || {}} /></section>
          )}
        </div>

        <aside className="rr-rail">
          <section className="gr-card" aria-labelledby="rr-anatomy-h">
            <p className="gr-eyebrow">Score anatomy</p>
            <h2 id="rr-anatomy-h" className="rr-rail__title">What shaped the score</h2>
            {hasAnatomy ? (
              <div className="rr-anatomy">
                {ANATOMY.map((a) => <Meter key={a.key} label={a.label} tone={a.tone} signal={signals[a.key]} />)}
              </div>
            ) : (
              <p className="gr-help">Not enough public evidence to break this score down.</p>
            )}
            <p className="gr-help">Weighted public signals. Collaboration needs review data and is shown only when available. Humor does not affect score.</p>
            <Link href="/about#methodology" className="gr-btn gr-btn--outline gr-btn--block">View methodology</Link>
          </section>

          <section id="rr-badge" className="gr-card gr-card--gold" aria-labelledby="rr-badge-h">
            <div className="rr-badge-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeSrc} alt={`@${data.username} GitRoast badge`} loading="lazy" />
            </div>
            <h2 id="rr-badge-h" className="rr-rail__title">Wear the evidence</h2>
            <p className="gr-help">Copy Markdown for your README. The badge links back to dated methodology.</p>
            <div className="gr-seg" role="tablist" aria-label="Badge style">
              {['card', 'shield'].map((s) => (
                <button key={s} type="button" role="tab" aria-selected={badgeStyle === s} onClick={() => setBadgeStyle(s)}>{s === 'card' ? 'Card' : 'Shield'}</button>
              ))}
            </div>
            <code className="gr-mono rr-code">{badgeMarkdown(data.username, badgeStyle)}</code>
            <button type="button" className="gr-btn gr-btn--dark gr-btn--block" onClick={() => share.copyBadge(badgeStyle)}>Copy badge Markdown</button>
          </section>

          {!data.isPro && onProClick && (
            <section className="gr-card gr-card--dark" aria-labelledby="rr-pro-h">
              <span className="gr-pill gr-pill--ember">Pro Roaster</span>
              <h2 id="rr-pro-h" className="gr-h3 rr-pro-title">Remember every burn.</h2>
              <p className="rr-pro-text">Unlock full history, custom personas, private comparisons and Ghost Mode.</p>
              <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={onProClick}>See Pro, no jump scare</button>
            </section>
          )}

          <section className="gr-card rr-extras">
            <RoastCertificate username={data.username} score={data.score} grade={data.grade} roastText={data.roast} isPro={data.isPro} />
            <GitHubWrapped username={data.username} isPro={data.isPro} />
            <Link href={`/universe/${data.username}`} className="gr-btn gr-btn--outline gr-btn--block">Launch 3D code solar system</Link>
          </section>

          <p className="gr-help rr-footnote">Keep it playful. Share public work, not personal information. Report harmful output from the result menu.</p>
        </aside>
      </div>
    </div>
  )
}
