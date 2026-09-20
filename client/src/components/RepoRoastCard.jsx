'use client'

// ============================================================
// GITROAST — RepoRoastCard Component
// ============================================================
// WHAT: Card displaying deep repository roast results:
//       - Repo metadata (stars, forks, language, open issues)
//       - Architecture code smells list
//       - Commit hygiene analysis
//       - Typewriter roast display with Voice Roast audio
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { createToast } from 'customizable-toast-notification'
import Link from 'next/link'

const TYPING_SPEED = 18

export default function RepoRoastCard({ data, onProClick }) {
  const [displayedText, setDisplayedText] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const intervalRef = useRef(null)
  const cursorTimerRef = useRef(null)

  const roastText = data.roast || ''

  // Typewriter effect
  useEffect(() => {
    if (!roastText) return

    let currentIndex = 0
    intervalRef.current = setInterval(() => {
      currentIndex += 1
      setDisplayedText(roastText.slice(0, currentIndex))

      if (currentIndex >= roastText.length) {
        clearInterval(intervalRef.current)
        setTypingDone(true)

        let blinks = 0
        cursorTimerRef.current = setInterval(() => {
          setShowCursor((prev) => !prev)
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

  // Voice roast with Web Speech API
  function handleVoiceRoast() {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) {
      createToast({
        type: 'warning',
        message: 'Speech synthesis is not supported on this browser.',
        position: 'top-center',
      })
      return
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = roastText.replace(/[`*#_~]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)

    utterance.rate = 0.92
    utterance.pitch = 0.88

    const voices = window.speechSynthesis.getVoices()
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel'))) ||
      voices.find((v) => v.lang.startsWith('en'))

    if (englishVoice) utterance.voice = englishVoice

    utterance.onstart = () => {
      setIsPlayingAudio(true)
      createToast({
        type: 'info',
        message: '🔊 Playing Voice Roast...',
        position: 'top-center',
        duration: 3000,
      })
    }

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
  }

  function handleCopyShare() {
    if (typeof window === 'undefined') return
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      createToast({
        type: 'success',
        message: '📋 Repository roast link copied to clipboard!',
        position: 'top-center',
        duration: 3500,
      })
    })
  }

  const scoreColor =
    data.score < 40 ? 'var(--bad)' : data.score < 70 ? 'var(--warn)' : 'var(--good)'

  return (
    <div className="repo-card card">
      {/* ── Header ── */}
      <div className="card-header">
        <div className="repo-meta-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.avatarUrl || `https://avatars.githubusercontent.com/${data.owner}?s=96`}
            alt={data.owner}
            className="repo-avatar"
            crossOrigin="anonymous"
            loading="eager"
          />
          <div>
            <div className="repo-title font-display">
              <a
                href={data.url || `https://github.com/${data.owner}/${data.repoName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-link"
              >
                {data.fullName} ↗
              </a>
            </div>
            <p className="repo-desc font-mono">{data.description}</p>
          </div>
        </div>

        <div className="score-block" title={`Repo Roast Score: ${data.score}/100`}>
          <div className="score-number font-display" style={{ color: scoreColor }}>
            {data.score}
          </div>
          <div className="score-label font-mono">/100 REPO SCORE</div>
          <div className="grade-badge font-mono" style={{ color: 'var(--bad)' }}>
            GRADE: {data.grade}
          </div>
        </div>
      </div>

      {/* ── Key Indicators Bar ── */}
      <div className="repo-stats-bar font-mono">
        <div className="stat-pill">
          <span className="pill-key">Lang:</span>
          <span className="pill-val">{data.language}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-key">Stars:</span>
          <span className="pill-val">{data.stars}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-key">Issues:</span>
          <span className="pill-val">{data.openIssues}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-key">Commit Hygiene:</span>
          <span className="pill-val">{data.commitQuality}%</span>
        </div>
      </div>

      {/* ── Code Smells ── */}
      {data.codeSmells && data.codeSmells.length > 0 && (
        <div className="smells-section">
          <div className="section-title font-mono">🚩 Architectural Red Flags</div>
          <div className="smells-list font-mono">
            {data.codeSmells.map((smell, idx) => (
              <div key={idx} className="smell-item">
                <span className="smell-icon">⚠️</span>
                <span>{smell}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shame Commits ── */}
      {data.shameCommits && data.shameCommits.length > 0 && (
        <div className="commits-section">
          <div className="section-title font-mono">💀 Questionable Commits</div>
          <div className="commits-list font-mono">
            {data.shameCommits.map((msg, idx) => (
              <div key={idx} className="commit-item">
                <span className="commit-hash">commit #{idx + 1}</span>
                <span className="commit-msg">&ldquo;{msg}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── The Roast Text Block ── */}
      <div className="roast-text-block">
        <div className="roast-text-header">
          <div className="roast-header-left">
            <p className="roast-text-label font-mono">🔥 The Repository Roast</p>
            {data.roastSource === 'ai' && (
              <span className="ai-badge font-mono">⚡ AI Roast</span>
            )}
          </div>
          {typingDone && (
            <button
              type="button"
              className={`voice-roast-btn font-mono ${isPlayingAudio ? 'voice-roast-btn--active' : ''}`}
              onClick={handleVoiceRoast}
              title={isPlayingAudio ? 'Stop reading' : 'Read roast aloud'}
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

      {/* Brand row & share buttons */}
      <div className="card-footer">
        <div className="card-brand font-mono">gitroast 🔥</div>
        <div className="share-actions">
          <button
            type="button"
            className="action-btn font-mono"
            onClick={handleCopyShare}
          >
            📋 Share Repo Roast
          </button>
          <Link href="/" className="action-btn font-mono action-btn--primary">
            Roast Another →
          </Link>
        </div>
      </div>

      <style jsx>{`
        .repo-card {
          width: 100%;
          max-width: 640px;
          background: #0d0d0d;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .card-header {
          padding: 1.5rem;
          background: linear-gradient(160deg, #121212 0%, #190a02 100%);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .repo-meta-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }
        .repo-avatar {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          border: 1px solid var(--border);
          object-fit: cover;
        }
        .repo-title {
          font-size: 1.5rem;
          line-height: 1.2;
        }
        .repo-link {
          color: var(--text-primary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .repo-link:hover {
          color: #ff6b00;
        }
        .repo-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 4px;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .score-block {
          text-align: right;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .score-number {
          font-size: 2.2rem;
          line-height: 1;
        }
        .score-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .grade-badge {
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 2px;
        }
        .repo-stats-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0.85rem 1.5rem;
          background: #080808;
          border-bottom: 1px solid var(--border);
        }
        .stat-pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          display: flex;
          gap: 6px;
        }
        .pill-key {
          color: var(--text-muted);
        }
        .pill-val {
          color: #ffb700;
          font-weight: 600;
        }
        .smells-section,
        .commits-section {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .section-title {
          font-size: 0.75rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .smells-list,
        .commits-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .smell-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #ffaa55;
          background: rgba(255, 107, 0, 0.06);
          border: 1px solid rgba(255, 107, 0, 0.15);
          padding: 6px 10px;
          border-radius: 6px;
        }
        .commit-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.82rem;
          background: rgba(255, 255, 255, 0.02);
          padding: 6px 10px;
          border-radius: 6px;
        }
        .commit-hash {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .commit-msg {
          color: #ff7777;
        }
        .roast-text-block {
          padding: 1.5rem;
        }
        .roast-text-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .roast-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .roast-text-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .ai-badge {
          background: rgba(255, 183, 0, 0.15);
          color: #ffb700;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 183, 0, 0.3);
        }
        .voice-roast-btn {
          background: rgba(255, 107, 0, 0.1);
          border: 1px solid rgba(255, 107, 0, 0.3);
          color: #ff6b00;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .voice-roast-btn:hover {
          background: rgba(255, 107, 0, 0.2);
          border-color: #ff6b00;
        }
        .voice-roast-btn--active {
          background: #ff4500;
          color: #fff;
          border-color: #ff4500;
        }
        .voice-pulse {
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        .roast-text {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #f0f0f0;
          font-style: italic;
        }
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1.1em;
          background: #ff6b00;
          vertical-align: text-bottom;
          margin-left: 2px;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          background: #080808;
          flex-wrap: wrap;
          gap: 10px;
        }
        .card-brand {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .share-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          border-color: #ff6b00;
          color: #ff6b00;
        }
        .action-btn--primary {
          background: #ff4500;
          color: #fff;
          border-color: #ff4500;
        }
        .action-btn--primary:hover {
          background: #ff6b00;
          color: #fff;
        }
      `}</style>
    </div>
  )
}
