'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toast, notify } from '@/utils/toast'
import './roast-result.css'

const TYPING_SPEED = 18

export default function RepoRoastCard({ data, onProClick }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const intervalRef = useRef(null)
  const roastText = data?.roast || ''

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

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
    const utterance = new SpeechSynthesisUtterance(roastText.replace(/[`*#_~]/g, ''))
    utterance.rate = 0.92
    utterance.pitch = 0.88
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find((v) => v.lang.startsWith('en') && /Natural|Google|Daniel/.test(v.name)) || voices.find((v) => v.lang.startsWith('en'))
    if (voice) utterance.voice = voice
    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    window.speechSynthesis.speak(utterance)
  }

  function handleCopyShare() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => notify.copied({ what: 'Repository roast link' }))
      .catch(() => toast.error('Could not copy the link', { description: 'Copy it from the address bar instead.' }))
  }

  if (!data) return null

  const firstSentence = (roastText.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] || roastText).trim()
  const stats = [
    ['Language', data.language || '—', 'Primary language'],
    ['Stars', data.stars ?? 0, 'Public signal, not score input'],
    ['Open issues', data.openIssues ?? 0, 'As of analysis'],
    ['Commit hygiene', `${data.commitQuality ?? 0}%`, 'Message quality'],
  ]

  return (
    <div className="rr">
      <div className="rr-capture">
        <section className="rr-hero" aria-label="Repository roast summary">
          <div className="rr-id">
            <span className="rr-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.avatarUrl || `https://avatars.githubusercontent.com/${data.owner}?s=96`} alt="" width={56} height={56} crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <b aria-hidden="true">{String(data.owner || '?').slice(0, 2).toUpperCase()}</b>
            </span>
            <div>
              <p className="rr-name">
                <a href={data.url || `https://github.com/${data.owner}/${data.repoName}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{data.fullName} ↗</a>
              </p>
              {data.description && <p className="rr-meta">{data.description}</p>}
            </div>
          </div>
          <div className="rr-hero__body">
            <div>
              <p className="rr-tags">Repository roast{data.roastSource === 'ai' ? ' • AI' : ''}</p>
              <h1 className="rr-quote">&ldquo;{firstSentence}&rdquo;</h1>
              <p className="rr-sub">Grade {data.grade}. Built from public repository signals only.</p>
            </div>
            <div className="gr-score rr-score" role="img" aria-label={`Repository score ${data.score} out of 100`}>
              <b>{data.score}</b>
              <small>Repo score / 100</small>
            </div>
          </div>
          <p className="rr-brand">gitroast.dev</p>
        </section>
      </div>

      <div className="rr-actions">
        <button type="button" className="gr-btn gr-btn--primary" onClick={handleCopyShare}>Share repo roast</button>
        <Link href="/" className="gr-btn gr-btn--outline">Roast another</Link>
        {!data.isPro && onProClick && <button type="button" className="gr-btn gr-btn--quiet" onClick={onProClick}>See Pro</button>}
      </div>

      <section className="rr-metrics" aria-label="Key metrics">
        {stats.map(([k, v, note]) => (
          <div key={k} className="gr-card rr-metric"><span className="gr-eyebrow rr-metric__k">{k}</span><b className="rr-metric__v">{v}</b><span className="gr-help">{note}</span></div>
        ))}
      </section>

      <div className="rr-cols">
        <div className="rr-main">
          <section className="gr-card rr-roast" aria-labelledby="rrc-h">
            <div className="rr-roast__head">
              <div><p className="gr-eyebrow">The roast</p><h2 id="rrc-h" className="gr-h3">Full read-out</h2></div>
              {typingDone && <button type="button" className="gr-btn gr-btn--outline" aria-pressed={isPlayingAudio} onClick={handleVoiceRoast}>{isPlayingAudio ? 'Stop voice' : 'Voice roast'}</button>}
            </div>
            <p className="rr-roast__text">{displayedText}{!typingDone && <span className="rr-caret" aria-hidden="true" />}</p>
          </section>

          {(data.codeSmells?.length > 0 || data.shameCommits?.length > 0) && (
            <section className="rr-charges" aria-labelledby="rrc-charges">
              <p className="gr-eyebrow">The charges</p>
              <h2 id="rrc-charges" className="gr-h2">Architecture sins, with receipts.</h2>
              {data.codeSmells?.length > 0 && (
                <article className="gr-card gr-card--ember rr-charge">
                  <div className="rr-charge__head"><h3>Architectural red flags</h3><span className="gr-pill gr-pill--ember">{data.codeSmells.length} found</span></div>
                  <ul className="rr-commits">{data.codeSmells.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </article>
              )}
              {data.shameCommits?.length > 0 && (
                <article className="gr-card rr-charge">
                  <div className="rr-charge__head"><h3>Questionable commits</h3><span className="gr-pill gr-pill--blue">{data.shameCommits.length} recent</span></div>
                  <ul className="rr-commits">{data.shameCommits.map((m, i) => <li key={i} className="gr-mono">&ldquo;{m}&rdquo;</li>)}</ul>
                  <a className="rr-evidence" href={data.url || `https://github.com/${data.owner}/${data.repoName}`} target="_blank" rel="noopener noreferrer">Inspect public evidence →</a>
                </article>
              )}
            </section>
          )}

          {typingDone && data.redemptionPlan?.length > 0 && (
            <section className="gr-card gr-card--gold" aria-labelledby="rrc-plan">
              <p className="gr-eyebrow">Codebase repairs</p>
              <h2 id="rrc-plan" className="gr-h3">Architect redemption plan</h2>
              <ol className="rr-plan">{data.redemptionPlan.map((t, i) => <li key={i}><span className="gr-mono">0{i + 1}</span>{t}</li>)}</ol>
            </section>
          )}
        </div>

        <aside className="rr-rail">
          <section className="gr-card gr-card--dark" aria-labelledby="rrc-pro">
            <span className="gr-pill gr-pill--ember">Pro Roaster</span>
            <h2 id="rrc-pro" className="gr-h3 rr-pro-title">Remember every burn.</h2>
            <p className="rr-pro-text">AI repository roasts, history and private repositories.</p>
            {!data.isPro && onProClick ? <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={onProClick}>See Pro, no jump scare</button> : <Link href="/dashboard" className="gr-btn gr-btn--outline gr-btn--block">Open dashboard</Link>}
          </section>
          <p className="gr-help rr-footnote">Keep it playful. Share public work, not personal information.</p>
        </aside>
      </div>
    </div>
  )
}
