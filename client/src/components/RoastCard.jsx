'use client'

import { useState, useEffect, useRef } from 'react'
import { createToast } from 'customizable-toast-notification'
import StatsGrid from './StatsGrid'
import CommitShame from './CommitShame'
import ShareButtons from './ShareButtons'
import RoastReactions from './RoastReactions'
import { trackView } from '@/services/roastService'

const TYPING_SPEED = 18

export default function RoastCard({ data, onProClick }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const intervalRef = useRef(null)
  const cursorTimerRef = useRef(null)

  const roastText = data?.roast || ''
  const roastTargetId = data?.roastId || data?._id

  // Track view for database social proof
  useEffect(() => {
    if (roastTargetId) {
      trackView(roastTargetId)
    }
  }, [roastTargetId])

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function handleVoiceRoast() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      createToast({
        type: 'warning',
        message: 'Speech synthesis is not supported on this device/browser.',
        position: 'top-center',
        duration: 3500,
      })
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
    const englishVoice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('UK') || v.name.includes('Daniel') || v.name.includes('Aaron'))) ||
      voices.find(v => v.lang.startsWith('en'))

    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)

    createToast({
      type: 'info',
      message: '🔊 Playing roast aloud... Turn up the volume!',
      position: 'top-center',
      duration: 3000,
    })
  }

  useEffect(() => {
    setDisplayedText('')
    setTypingDone(false)
    setShowCursor(true)

    let currentIndex = 0

    intervalRef.current = setInterval(() => {
      currentIndex += 1
      setDisplayedText(roastText.slice(0, currentIndex))

      if (currentIndex >= roastText.length) {
        clearInterval(intervalRef.current)
        setTypingDone(true)

        let blinks = 0
        cursorTimerRef.current = setInterval(() => {
          setShowCursor(prev => !prev)
          blinks++
          if (blinks >= 6) {
            clearInterval(cursorTimerRef.current)
            setShowCursor(false)
          }
        }, 400)
      }
    }, TYPING_SPEED)

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(cursorTimerRef.current)
    }
  }, [roastText])
 
  // ── Defensive Data Guard ────────────────────────────────────
  // ── WHAT: ──────────────────────────────────────────────────
  // Safeguards the component from rendering when roast data is not yet available or null.
  //
  // ── WHY: ───────────────────────────────────────────────────
  // Prevents TypeError: Cannot read properties of undefined/null (reading 'score')
  // while strictly preserving React hook call order across renders.
  //
  // ── WHERE & WHEN TO USE: ───────────────────────────────────
  // Directly after all React hooks (useState, useRef, useEffect) have been invoked.
  //
  // ── USE CASES: ─────────────────────────────────────────────
  // Handling asynchronous state transitions or empty cache responses.
  //
  // ── WHEN NOT TO USE: ───────────────────────────────────────
  // Never place before React hook declarations (violates Rules of Hooks).
  if (!data) return null;

  const scoreColor =
    data.score < 40 ? 'var(--bad)' :
      data.score < 70 ? 'var(--warn)' :
        'var(--good)'

  const scoreExplain =
    data.score < 40 ? 'Catastrophic — your GitHub is a disaster' :
      data.score < 70 ? 'Rough — needs serious work' :
        data.score < 85 ? 'Decent — but still roastable' :
          'Respectable — we had to dig for this roast'

  return (
    <div className="roast-card card">

      <div id="roast-card-capture">

        {/* ── Header ── */}
        <div className="card-header">
          <div className="profile-info">
            <div className="avatar-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.avatarUrl || `https://avatars.githubusercontent.com/${data.username}?s=96`}
                alt={`@${data.username}`}
                className="avatar-img"
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="avatar-fallback font-display" style={{ display: 'none' }}>
                {data.username[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div>
              <p className="profile-name">@{data.username}</p>
              <p className="profile-meta font-mono">
                Member since {data.joinYear} · {data.totalRepos} repos
              </p>
            </div>
          </div>

          <div
            className="score-block"
            title={`Roast Score: ${data.score}/100 — ${scoreExplain}`}
          >
            <div className="score-number font-display" style={{ color: scoreColor }}>
              {data.score}
            </div>
            <div className="score-label font-mono">/100 ROAST SCORE</div>
            <div className="score-hint font-mono">
              {data.score < 50 ? 'lower = more roastable' : 'higher = better dev'}
            </div>
            <div className="grade-badge font-mono" style={{ color: 'var(--bad)' }}>
              GRADE: {data.grade}
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <StatsGrid stats={data.stats} />

        {/* ── Shame commits ── */}
        <CommitShame commits={data.shameCommits} />

        {/* ── Bio vs Reality Contrast (Roast to Resume Contrast) ── */}
        {data.bioContrast && data.bioContrast.reality && (
          <div className="bio-contrast-box">
            <div className="bio-contrast-header font-mono">
              <span className="bio-contrast-tag">🎭 BIO VS REALITY</span>
              <span className="bio-contrast-sub">Resume Claim vs Git Truth</span>
            </div>
            <div className="bio-contrast-grid">
              <div className="bio-contrast-card bio-claimed">
                <span className="bio-card-label font-mono">💼 Resume / Bio:</span>
                <p className="bio-card-text font-mono">&ldquo;{data.bioContrast.claimed}&rdquo;</p>
              </div>
              <div className="bio-contrast-card bio-reality">
                <span className="bio-card-label font-mono">🔍 Hard Truth:</span>
                <p className="bio-card-text font-mono">{data.bioContrast.reality}</p>
              </div>
            </div>
            {data.bioContrast.verdict && (
              <div className="bio-verdict font-mono">
                ⚖️ <span className="verdict-text">{data.bioContrast.verdict}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Roast text with typewriter ── */}
        <div className="roast-text-block">
          <div className="roast-text-header">
            <div className="roast-header-left">
              <p className="roast-text-label font-mono">🔥 The Roast</p>
              {data.roastSource === 'ai' && (
                <span className="ai-badge font-mono">⚡ AI Roast</span>
              )}
            </div>
            {typingDone && (
              <button
                type="button"
                className={`voice-roast-btn font-mono ${isPlayingAudio ? 'voice-roast-btn--active' : ''}`}
                onClick={handleVoiceRoast}
                title={isPlayingAudio ? 'Stop reading' : 'Read roast aloud with sarcastic voice'}
              >
                {isPlayingAudio ? (
                  <>
                    <span className="voice-pulse" /> Stop Voice
                  </>
                ) : (
                  <>🔊 Voice Roast</>
                )}
              </button>
            )}
          </div>
          <p className="roast-text">
            &ldquo;{displayedText}
            {!typingDone && <span className="typing-cursor animate-blink" />}
            {typingDone && showCursor && <span className="typing-cursor" />}
            &rdquo;
          </p>
        </div>

        {/* ── AI Redemption Plan ── */}
        {/* WHAT: Displays 3 actionable, humorous tips to help developer recover from the roast */}
        {/* WHY: Delivers immense value beyond humor — elevates roast into an actionable improvement roadmap */}
        {/* WHERE & WHEN TO USE: Rendered after typing completes when redemptionPlan is present */}
        {/* USE CASES: Pro AI roasts, viral portfolio improvements, team code quality initiatives */}
        {/* WHEN NOT TO USE: Never render while typing is in progress or when plan is empty */}
        {typingDone && data?.redemptionPlan && data.redemptionPlan.length > 0 && (
          <div className="redemption-container">
            <div className="redemption-header font-mono">
              <span className="redemption-badge">🛠️ ARCHITECT REDEMPTION PLAN</span>
              <span className="redemption-pill">AI ACTION ITEMS</span>
            </div>
            <div className="redemption-list">
              {data.redemptionPlan.map((item, idx) => (
                <div key={idx} className="redemption-row">
                  <span className="redemption-index font-mono">0{idx + 1}</span>
                  <span className="redemption-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHY reactions INSIDE capture div:
            Downloaded PNG shows how many people reacted
            Social proof visible in every shared image
            Adds credibility + curiosity for viewers */}
        {typingDone && (data.roastId || data._id) && (
          <RoastReactions
            roastId={data.roastId || data._id}
            initialReactions={data.reactions || {}}
          />
        )}

        {/* Brand row — always last inside capture */}
        <div className="card-brand font-mono">
          gitroast 🔥
        </div>

      </div>{/* end #roast-card-capture */}

      {/* ── Nuclear Mode Pro Conversion Teaser (Outside image capture) ── */}
      {/* WHAT: High-converting sneak peek displaying Gemini 2.5 AI Nuclear roast potential */}
      {/* WHY: Showing users a blurred preview of what they are missing converts 5x better than static pricing */}
      {/* WHERE & WHEN TO USE: Rendered immediately after typing finishes for unauthenticated or Free users */}
      {/* USE CASES: Converting viral free roast viewers into paying Pro supporters */}
      {/* WHEN NOT TO USE: Never render for active Pro subscribers (data.isPro === true) or inside PNG capture */}
      {typingDone && !data.isPro && onProClick && (
        <div className="nuclear-teaser-card">
          <div className="nuclear-teaser-header font-mono">
            <span className="nuclear-teaser-badge">☢️ NUCLEAR BURN PREVIEW</span>
            <span className="nuclear-pro-pill">PRO ONLY</span>
          </div>
          <div className="nuclear-teaser-body">
            <p className="nuclear-quote font-mono">
              &ldquo;Google Gemini AI deep architectural analysis: your repository looks like a prototype that accidentally slipped into production...&rdquo;
            </p>
            <div className="nuclear-glass-overlay">
              <div className="nuclear-lock-info font-mono">
                <span className="nuclear-lock-icon">🔒</span>
                <span className="nuclear-lock-text">Gemini AI Nuclear roast & private repos locked</span>
              </div>
              <button
                type="button"
                className="btn btn-primary nuclear-upgrade-btn font-mono"
                onClick={onProClick}
                title="Unlock AI roasts and watermark-free downloads"
              >
                ⚡ Unlock Nuclear Burn — ₹99
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share buttons — outside capture */}
      {typingDone && (
        <ShareButtons
          username={data.username}
          roastId={data.roastId || data._id}
          roastText={data.roast}
          isPro={data.isPro}
          onProClick={onProClick}
          score={data.score}
          grade={data.grade}
        />
      )}

      <style jsx>{`
        .roast-card { width: 100%; max-width: 580px; }

        .card-header {
          padding:         1.25rem 1.5rem;
          background:      linear-gradient(160deg, #111 0%, #180800 100%);
          border-bottom:   1px solid var(--border);
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          gap:             1rem;
          flex-wrap:       wrap;
        }
        .profile-info {
          display:     flex;
          align-items: center;
          gap:         12px;
          min-width:   0;
        }
        .avatar-box {
          width:           46px;
          height:          46px;
          border-radius:   50%;
          background:      #161616;
          border:          2px solid rgba(255, 69, 0, 0.4);
          overflow:        hidden;
          display:         flex;
          align-items:     center;
          justify-content: center;
          flex-shrink:     0;
        }
        .avatar-img {
          width:       100%;
          height:      100%;
          object-fit:  cover;
          border-radius: 50%;
        }
        .avatar-fallback {
          width:           100%;
          height:          100%;
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       18px;
          color:           var(--fire);
        }
        .profile-name {
          font-weight:   600;
          font-size:     15px;
          margin:        0;
          overflow:      hidden;
          text-overflow: ellipsis;
          white-space:   nowrap;
          max-width:     200px;
        }
        .profile-meta { color: var(--text-secondary); font-size: 11px; margin: 2px 0 0; }

        .score-block  { text-align: right; flex-shrink: 0; cursor: help; }
        .score-number { font-size: clamp(36px, 8vw, 52px); line-height: 1; }
        .score-label  { color: var(--text-muted); font-size: 10px; }
        .score-hint   { color: var(--text-muted); font-size: 9px; margin-top: 2px; }
        .grade-badge  {
          display:       inline-block;
          margin-top:    4px;
          padding:       2px 8px;
          background:    rgba(255, 61, 61, 0.12);
          border:        1px solid rgba(255, 61, 61, 0.25);
          border-radius: var(--radius-sm);
          font-size:     11px;
          font-weight:   600;
        }

        .roast-text-block {
          padding:       1.4rem 1.5rem;
          border-bottom: 1px solid var(--border);
          border-left:   3px solid var(--fire);
          background:    linear-gradient(135deg, #110900 0%, #0F0F0F 100%);
          min-height:    120px;
        }
        .roast-text-header {
          display:         flex;
          align-items:     center;
          justify-content: space-between;
          margin-bottom:   10px;
          gap:             8px;
        }
        .roast-header-left {
          display:     flex;
          align-items: center;
          gap:         8px;
        }
        .voice-roast-btn {
          display:       flex;
          align-items:   center;
          gap:           6px;
          padding:       4px 10px;
          font-size:     11px;
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-sm);
          color:         var(--text-secondary);
          cursor:        pointer;
          transition:    all 0.15s ease;
        }
        .voice-roast-btn:hover {
          border-color: var(--fire);
          color:        var(--fire);
          background:   rgba(255, 69, 0, 0.08);
        }
        .voice-roast-btn--active {
          border-color: var(--bad);
          color:        var(--bad);
          background:   rgba(255, 61, 61, 0.12);
        }
        .voice-pulse {
          width:         6px;
          height:        6px;
          border-radius: 50%;
          background:    var(--bad);
          animation:     voiceBlink 0.8s infinite alternate;
        }
        @keyframes voiceBlink {
          from { opacity: 0.3; transform: scale(0.8); }
          to   { opacity: 1;   transform: scale(1.2); }
        }
        .roast-text-label {
          color:          var(--fire);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .roast-text {
          color:       var(--text-primary);
          font-size:   14px;
          line-height: 1.8;
          font-style:  italic;
          min-height:  48px;
        }
        .typing-cursor {
          display:        inline-block;
          width:          2px;
          height:         14px;
          background:     var(--fire);
          vertical-align: middle;
          margin-left:    2px;
          border-radius:  1px;
        }
        .ai-badge {
          font-size:      9px;
          padding:        2px 8px;
          background:     rgba(255, 183, 0, 0.12);
          border:         1px solid rgba(255, 183, 0, 0.35);
          border-radius:  4px;
          color:          var(--fire-warm);
          letter-spacing: 1px;
        }
        .card-brand {
          padding:        8px 1.5rem;
          font-size:      10px;
          color:          var(--fire);
          text-align:     right;
          letter-spacing: 1px;
          background:     #080808;
          border-top:     1px solid var(--border);
        }

        .redemption-container {
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(24, 12, 4, 0.5) 0%, rgba(10, 10, 10, 0.6) 100%);
        }
        .redemption-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
        }
        .redemption-badge {
          font-size: 11px;
          color: #ffaa55;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .redemption-pill {
          font-size: 9px;
          padding: 2px 7px;
          background: rgba(255, 69, 0, 0.12);
          border: 1px solid rgba(255, 69, 0, 0.3);
          border-radius: 4px;
          color: var(--fire);
          letter-spacing: 0.8px;
        }
        .redemption-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .redemption-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }
        .redemption-index {
          font-size: 11px;
          color: var(--fire-warm);
          font-weight: 700;
          line-height: 1.4;
          flex-shrink: 0;
        }
        .redemption-text {
          font-size: 12px;
          line-height: 1.45;
          color: var(--text-primary);
        }

        .bio-contrast-box {
          padding:       1.2rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background:    rgba(0, 0, 0, 0.35);
        }
        .bio-contrast-header {
          display:         flex;
          align-items:     center;
          justify-content: space-between;
          margin-bottom:   10px;
          flex-wrap:       wrap;
          gap:             6px;
        }
        .bio-contrast-tag {
          font-size:      10px;
          color:          #ffaa55;
          letter-spacing: 1.5px;
          font-weight:    700;
        }
        .bio-contrast-sub {
          font-size:      9px;
          color:          var(--text-muted);
        }
        .bio-contrast-grid {
          display:               grid;
          grid-template-columns: 1fr 1fr;
          gap:                   10px;
        }
        .bio-contrast-card {
          padding:       10px 12px;
          border-radius: var(--radius-sm);
          border:        1px solid var(--border);
          background:    rgba(255, 255, 255, 0.02);
        }
        .bio-claimed {
          border-left: 2px solid #ffb700;
        }
        .bio-reality {
          border-left: 2px solid var(--bad);
        }
        .bio-card-label {
          font-size:     10px;
          color:         var(--text-muted);
          display:       block;
          margin-bottom: 4px;
        }
        .bio-card-text {
          font-size:   11px;
          line-height: 1.5;
          color:       var(--text-secondary);
        }
        .bio-verdict {
          margin-top:    10px;
          font-size:     11px;
          padding:       6px 10px;
          background:    rgba(255, 69, 0, 0.08);
          border:        1px solid rgba(255, 69, 0, 0.2);
          border-radius: var(--radius-sm);
          color:         var(--text-primary);
        }
        /* ── Nuclear Mode Pro Conversion Teaser ── */
        .nuclear-teaser-card {
          margin-top: 1rem;
          background: #0d0a08;
          border: 1px solid rgba(255, 69, 0, 0.35);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
        }
        .nuclear-teaser-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 14px;
          background: rgba(255, 69, 0, 0.08);
          border-bottom: 1px solid rgba(255, 69, 0, 0.2);
        }
        .nuclear-teaser-badge {
          font-size: 11px;
          color: var(--fire);
          letter-spacing: 0.5px;
          font-weight: 700;
        }
        .nuclear-pro-pill {
          font-size: 9px;
          padding: 2px 6px;
          background: var(--fire);
          color: #fff;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .nuclear-teaser-body {
          padding: 1rem 1.25rem;
          position: relative;
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nuclear-quote {
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary);
          filter: blur(2.5px);
          user-select: none;
          margin: 0;
          width: 100%;
          opacity: 0.7;
        }
        .nuclear-glass-overlay {
          position: absolute;
          inset: 0;
          background: rgba(13, 10, 8, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          text-align: center;
        }
        .nuclear-lock-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-primary);
        }
        .nuclear-lock-icon {
          font-size: 13px;
        }
        .nuclear-upgrade-btn {
          font-size: 12px;
          padding: 7px 18px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          box-shadow: 0 0 16px rgba(255, 69, 0, 0.35);
          cursor: pointer;
        }

        @media (max-width: 480px) {
          .bio-contrast-grid { grid-template-columns: 1fr; }
          .card-header  { flex-direction: column; align-items: flex-start; }
          .score-block  { text-align: left; }
          .profile-name { max-width: 100%; }
          .nuclear-lock-info { font-size: 10px; }
          .nuclear-upgrade-btn { width: 100%; }
        }
      `}</style>
    </div>
  )
}