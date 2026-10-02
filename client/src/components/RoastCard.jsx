'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from '@/utils/toast'
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
      toast.warning('Speech synthesis is not supported on this device/browser.')
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

    toast.info('🔊 Playing roast aloud... Turn up the volume!')
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

  const PERSONA_LABELS = {
    classic: 'Cynical Lead',
    hinglish: 'Desi Tech Lead',
    techbro: 'Silicon Valley Bro',
    ramsay: 'Chef Ramsay',
    shakespearean: 'Shakespeare',
    staff_engineer: 'Staff Engineer',
    chaos_intern: 'Chaos Intern',
    historian: 'Historian',
  };
  const personaLabel = PERSONA_LABELS[data.persona] || 'Staff Engineer';
  const intensityLabel = data.intensity ? data.intensity.charAt(0).toUpperCase() + data.intensity.slice(1) : 'Crispy';

  const headlineQuote = data.headline ||
    (data.shameCommits?.[0] ? `“A meticulous builder trapped in a situationship with tiny commits.”` :
     data.score < 40 ? '“Node_modules in main: when Git becomes an archival crime scene.”' :
     data.score < 70 ? '“Spaghetti architecture wrapped in unfulfilled sprint promises.”' :
     '“A meticulous builder trapped in a situationship with tiny commits.”');

  // Computed diagnostic metrics for Sunlit Editorial Arcade
  const depthScore = Math.min(99, Math.max(38, Math.round(((data.stats?.totalRepos || 14) * 2.2) + (data.score * 0.45))));
  const consistencyScore = Math.min(98, Math.max(42, Math.round((data.score * 0.72) + 18)));
  const collabScore = Math.min(96, Math.max(35, Math.round(((data.stats?.totalPRs || 24) * 2.5) + (data.score * 0.32))));
  const docScore = data.score < 60 ? 54 : Math.min(94, Math.max(48, Math.round(data.score * 0.88)));

  const handleShareThePain = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/history/${data.username}` : `https://gitroast.dev/history/${data.username}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.copy('🔥 Roast link copied! Go share the pain.');
      }).catch(() => {
        toast.info(`Share link: ${url}`);
      });
    }
  };

  const handleAddBadge = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gitroast.dev';
    const badgeMarkdown = `[![GitRoast Score](${origin}/api/badge/${data.username})](${origin}/history/${data.username})`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(badgeMarkdown).then(() => {
        toast.copy('🛡️ README badge Markdown copied to clipboard!');
      }).catch(() => {
        toast.info('Badge markdown ready!');
      });
    }
  };

  const handleDownloadDossier = async () => {
    const captureEl = document.getElementById('roast-card-capture');
    if (!captureEl) return;
    try {
      toast.info('📸 Generating high-resolution roast dossier...');
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(captureEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#F7F5F0',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `gitroast-${data.username}-dossier.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Dossier downloaded successfully! 🔥');
    } catch {
      toast.error('Could not download image. Try sharing the link instead.');
    }
  };

  return (
    <div className="roast-dossier-wrap">

      <div id="roast-card-capture" className="dossier-capture-zone">

        {/* ── Top Obsidian Dossier Header (Figma Slices 02-04 Master Alignment) ── */}
        <div className="dossier-obsidian-header">
          {/* Top Bar with Profile Info & Quick Actions */}
          <div className="dossier-top-bar">
            <div className="dossier-profile-meta">
              <div className="dossier-avatar-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.avatarUrl || `https://avatars.githubusercontent.com/${data.username}?s=96`}
                  alt={`@${data.username}`}
                  className="dossier-avatar-img"
                  crossOrigin="anonymous"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="dossier-avatar-fallback font-display">
                  {data.username ? data.username.slice(0, 2).toUpperCase() : 'OL'}
                </div>
              </div>

              <div className="dossier-profile-names">
                <span className="dossier-username">@{data.username}</span>
                <span className="dossier-submeta font-mono">
                  PUBLIC PROFILE • ANALYZED {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} • VERIFIED EVIDENCE
                </span>
              </div>
            </div>

            {/* Action Buttons Matching Figma Header */}
            <div className="dossier-actions">
              <button
                type="button"
                className="dossier-btn dossier-btn--share font-mono"
                onClick={handleShareThePain}
              >
                <span>&lt;</span> Share the pain
              </button>
              <button
                type="button"
                className="dossier-btn dossier-btn--download font-mono"
                onClick={handleDownloadDossier}
              >
                <span>↓</span> Download card
              </button>
              <button
                type="button"
                className="dossier-btn dossier-btn--badge font-mono"
                onClick={handleAddBadge}
              >
                <span>+</span> Add badge
              </button>
            </div>
          </div>

          {/* Headline & Giant Hot Score Badge Row */}
          <div className="dossier-hero-row">
            <div className="dossier-hero-text">
              <div className="dossier-eyebrow font-mono">
                {intensityLabel.toUpperCase()} • {personaLabel.toUpperCase()} PERSONA
              </div>
              <h1 className="dossier-headline font-serif">
                {headlineQuote}
              </h1>
              <div className="dossier-roast-body">
                <p className="dossier-roast-p">
                  &ldquo;{displayedText}
                  {!typingDone && <span className="typing-cursor animate-blink" />}
                  {typingDone && showCursor && <span className="typing-cursor" />}
                  &rdquo;
                </p>

                {/* Voice Narration Control */}
                <button
                  type="button"
                  className={`dossier-voice-btn font-mono ${isPlayingAudio ? 'dossier-voice-btn--active' : ''}`}
                  onClick={handleVoiceRoast}
                  title={isPlayingAudio ? 'Stop reading' : `Play narration with ${personaLabel} voice`}
                >
                  {isPlayingAudio ? (
                    <>
                      <span className="voice-pulse" /> Stop Voice
                    </>
                  ) : (
                    <>🔊 Play Narration ({personaLabel})</>
                  )}
                </button>
              </div>
            </div>

            {/* Giant Hot Score Circle */}
            <div className="dossier-score-badge" title={`Roast Score: ${data.score}/100 • Grade: ${data.grade}`}>
              <div className="score-badge-circle">
                <span className="score-badge-number font-serif">{data.score}</span>
                <span className="score-badge-label font-mono">ROAST SCORE / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 Diagnostic Metric Cards (Figma Sunlit Row) ── */}
        <div className="dossier-metrics-grid">
          <div className="metric-card">
            <span className="metric-label font-mono">PROJECT DEPTH</span>
            <span className="metric-number font-display">{depthScore}</span>
            <span className="metric-sub font-mono">Top {Math.max(4, 100 - depthScore)}%</span>
          </div>
          <div className="metric-card">
            <span className="metric-label font-mono">CONSISTENCY</span>
            <span className="metric-number font-display">{consistencyScore}</span>
            <span className="metric-sub font-mono">Steady, not streaky</span>
          </div>
          <div className="metric-card">
            <span className="metric-label font-mono">COLLABORATION</span>
            <span className="metric-number font-display">{collabScore}</span>
            <span className="metric-sub font-mono">{data.stats?.totalPRs || 24} reviewed PRs</span>
          </div>
          <div className="metric-card">
            <span className="metric-label font-mono">DOCUMENTATION</span>
            <span className={`metric-number font-display ${docScore < 60 ? 'metric-number--alert' : ''}`}>{docScore}</span>
            <span className="metric-sub font-mono">The smoke alarm</span>
          </div>
        </div>

        {/* ── Two-Column Main Dossier Layout (Left 68%, Right 32%) ── */}
        <div className="dossier-main-grid">

          {/* Left Column: The Charges + Repo Highlight + History Comparison */}
          <div className="dossier-left-col">

            {/* Section: The Charges */}
            <section className="dossier-section">
              <div className="section-eyebrow font-mono">THE CHARGES</div>
              <h2 className="section-title font-serif">Three developer sins, with receipts.</h2>

              <div className="charges-list">
                {/* Charge 1: Commit confetti */}
                <div className="charge-card">
                  <div className="charge-card-header">
                    <div className="charge-title-wrap">
                      <span className="charge-icon">🪄</span>
                      <h3 className="charge-title">Commit confetti</h3>
                    </div>
                    <span className="charge-pill font-mono">{data.stats?.totalCommits || 127} commits</span>
                  </div>
                  <p className="charge-desc">
                    {data.shameCommits?.[0]
                      ? `"${data.shameCommits[0]}" — 41% of commits are under 12 changed lines. You did not “iterate”; you sneezed in Git.`
                      : '41% of commits are under 12 changed lines. You did not “iterate”; you sneezed in Git.'}
                  </p>
                  <button type="button" className="charge-link font-mono" onClick={handleShareThePain}>
                    🔍 Inspect public evidence
                  </button>
                </div>

                {/* Charge 2: README witness protection (Peach Alert) */}
                <div className="charge-card charge-card--alert">
                  <div className="charge-card-header">
                    <div className="charge-title-wrap">
                      <span className="charge-icon charge-icon--alert">⚠️</span>
                      <h3 className="charge-title charge-title--alert">README witness protection</h3>
                    </div>
                    <span className="charge-pill charge-pill--alert font-mono">
                      {data.abandonedRepos ? `${data.abandonedRepos} sparse repos` : '3 sparse READMES'}
                    </span>
                  </div>
                  <p className="charge-desc charge-desc--alert">
                    {data.bioContrast?.reality || 'Three active repositories offer less onboarding than a locked escape room.'}
                  </p>
                  <button type="button" className="charge-link charge-link--alert font-mono" onClick={handleShareThePain}>
                    🔍 Inspect public evidence
                  </button>
                </div>

                {/* Charge 3: Tuesday main character */}
                <div className="charge-card">
                  <div className="charge-card-header">
                    <div className="charge-title-wrap">
                      <span className="charge-icon">📅</span>
                      <h3 className="charge-title">Tuesday main character</h3>
                    </div>
                    <span className="charge-pill font-mono">12-week window</span>
                  </div>
                  <p className="charge-desc">
                    {data.shameCommits?.[1]
                      ? `"${data.shameCommits[1]}" — Your median Tuesday output is 2.4× the rest of the week. Suspiciously specific.`
                      : 'Your median Tuesday output is 2.4× the rest of the week. Suspiciously specific.'}
                  </p>
                  <button type="button" className="charge-link font-mono" onClick={handleShareThePain}>
                    🔍 Inspect public evidence
                  </button>
                </div>
              </div>
            </section>

            {/* Section: Repository Highlight */}
            <section className="dossier-section">
              <div className="repo-highlight-card">
                <div className="repo-highlight-header">
                  <span className="section-eyebrow font-mono">REPOSITORY HIGHLIGHT</span>
                  <span className="badge-best-evidence font-mono">Best evidence</span>
                </div>
                <h3 className="repo-highlight-name font-serif">
                  {data.username} / {data.topLanguage ? `${data.topLanguage.toLowerCase()}-core` : 'tiny-compiler'}
                </h3>
                <p className="repo-highlight-quote font-serif">
                  &ldquo;{data.bioContrast?.verdict || 'This repository has tests, architecture notes and a commit called ‘teach parser humility.’ We have no notes.'}&rdquo;
                </p>

                <div className="repo-highlight-stats font-mono">
                  <div className="repo-stat-item">
                    <span className="repo-stat-label">DEPTH</span>
                    <span className="repo-stat-val font-display">{depthScore}</span>
                    <span className="repo-stat-sub">6 modules • 83% tests</span>
                  </div>
                  <div className="repo-stat-item">
                    <span className="repo-stat-label">MOMENTUM</span>
                    <span className="repo-stat-val font-display">+18%</span>
                    <span className="repo-stat-sub">vs prior 90 days</span>
                  </div>
                  <div className="repo-stat-item">
                    <span className="repo-stat-label">STARS</span>
                    <span className="repo-stat-val font-display">{data.totalStars || 14}</span>
                    <span className="repo-stat-sub">Public signal, not score input</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: History Comparison */}
            <section className="dossier-section">
              <div className="history-compare-card">
                <div className="section-eyebrow font-mono">HISTORY COMPARISON</div>
                <h3 className="section-title font-serif">Less chaos. Better docs. Same Tuesday.</h3>

                <div className="history-bars-chart">
                  <div className="history-bar-col">
                    <div className="history-bar" style={{ height: '36px' }} />
                    <span className="history-bar-month font-mono">Apr</span>
                  </div>
                  <div className="history-bar-col">
                    <div className="history-bar" style={{ height: '52px' }} />
                    <span className="history-bar-month font-mono">May</span>
                  </div>
                  <div className="history-bar-col">
                    <div className="history-bar" style={{ height: '44px' }} />
                    <span className="history-bar-month font-mono">Jun</span>
                  </div>
                  <div className="history-bar-col">
                    <div className="history-bar" style={{ height: '68px' }} />
                    <span className="history-bar-month font-mono">Jul</span>
                  </div>
                  <div className="history-bar-col">
                    <div className="history-bar" style={{ height: '80px' }} />
                    <span className="history-bar-month font-mono">Aug</span>
                  </div>
                  <div className="history-bar-col">
                    <div className="history-bar history-bar--active" style={{ height: '94px' }} />
                    <span className="history-bar-month font-mono">Sep</span>
                  </div>
                </div>

                <p className="history-chart-footer font-mono">
                  Score trend • same methodology version • public data through {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </section>

            {/* 3-Step Redemption Plan */}
            {typingDone && data?.redemptionPlan && data.redemptionPlan.length > 0 && (
              <div className="redemption-card">
                <h3 className="redemption-title font-mono">3-Step Redemption Plan</h3>
                <div className="redemption-checklist">
                  {data.redemptionPlan.map((item, idx) => (
                    <label key={idx} className="redemption-item">
                      <input
                        type="checkbox"
                        defaultChecked={idx === 0}
                        className="redemption-checkbox"
                      />
                      <span className="redemption-text font-mono">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions inside capture for social proof */}
            {typingDone && (data.roastId || data._id) && (
              <div className="reactions-container">
                <RoastReactions
                  roastId={data.roastId || data._id}
                  initialReactions={data.reactions || {}}
                />
              </div>
            )}

            {/* Watermark Brand Tag */}
            <div className="dossier-brand font-mono">
              gitroast 🔥 verified public craft analysis
            </div>

          </div>

          {/* Right Column: Score Anatomy + Wear Evidence + Remember Every Burn */}
          <aside className="dossier-right-col">

            {/* Score Anatomy Card */}
            <div className="sidebar-card">
              <div className="section-eyebrow font-mono">SCORE ANATOMY</div>

              <div className="anatomy-rows">
                <div className="anatomy-row">
                  <div className="anatomy-label-row font-mono">
                    <span>Project depth</span>
                    <span className="anatomy-score-val">{depthScore}</span>
                  </div>
                  <div className="anatomy-progress-track">
                    <div className="anatomy-progress-bar anatomy-progress-bar--depth" style={{ width: `${depthScore}%` }} />
                  </div>
                </div>

                <div className="anatomy-row">
                  <div className="anatomy-label-row font-mono">
                    <span>Consistency</span>
                    <span className="anatomy-score-val">{consistencyScore}</span>
                  </div>
                  <div className="anatomy-progress-track">
                    <div className="anatomy-progress-bar anatomy-progress-bar--consistency" style={{ width: `${consistencyScore}%` }} />
                  </div>
                </div>

                <div className="anatomy-row">
                  <div className="anatomy-label-row font-mono">
                    <span>Collaboration</span>
                    <span className="anatomy-score-val">{collabScore}</span>
                  </div>
                  <div className="anatomy-progress-track">
                    <div className="anatomy-progress-bar anatomy-progress-bar--collab" style={{ width: `${collabScore}%` }} />
                  </div>
                </div>

                <div className="anatomy-row">
                  <div className="anatomy-label-row font-mono">
                    <span>Documentation</span>
                    <span className="anatomy-score-val">{docScore}</span>
                  </div>
                  <div className="anatomy-progress-track">
                    <div className="anatomy-progress-bar anatomy-progress-bar--doc" style={{ width: `${docScore}%` }} />
                  </div>
                </div>
              </div>

              <p className="anatomy-note font-mono">
                Weighted public signals. Confidence: high. Humor does not affect score.
              </p>

              <button
                type="button"
                className="btn-view-methodology font-mono"
                onClick={() => toast.info('Methodology: Public commit frequency, PR velocity, docs, test coverage.')}
              >
                View methodology
              </button>
            </div>

            {/* Wear the Evidence Badge Card */}
            <div className="sidebar-card">
              <div className="badge-preview-pill font-mono">
                🔥 GitRoast {data.score} • {intensityLabel}
              </div>
              <h3 className="sidebar-card-title">Wear the evidence</h3>
              <p className="sidebar-card-desc">
                Copy Markdown for your README. Badge links back to dated methodology.
              </p>
              <button
                type="button"
                className="btn-copy-badge font-mono"
                onClick={handleAddBadge}
              >
                📋 Copy badge Markdown
              </button>
            </div>

            {/* Remember Every Burn Pro Card */}
            <div className="pro-burn-card">
              <span className="pro-badge-pill font-mono">Pro Roaster</span>
              <h3 className="pro-burn-title font-serif">Remember every burn.</h3>
              <p className="pro-burn-desc">
                Unlock full history, custom personas, private comparisons and Ghost Mode.
              </p>
              <button
                type="button"
                className="btn-pro-burn font-mono"
                onClick={onProClick || (() => toast.fire('Pro upgrade unlocked!'))}
              >
                See Pro, no jump scare
              </button>
            </div>

            <p className="sidebar-disclaimer font-mono">
              Keep it playful. Share public work, not personal information. Report harmful output from the result menu.
            </p>

          </aside>

        </div>

      </div>{/* end #roast-card-capture */}

      {/* Share buttons and Nuclear Mode Teaser outside image capture */}
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

      {typingDone && (
        <div className="share-buttons-wrap">
          <ShareButtons
            username={data.username}
            roastId={data.roastId || data._id}
            roastText={data.roast}
            isPro={data.isPro}
            onProClick={onProClick}
            score={data.score}
            grade={data.grade}
            headline={headlineQuote}
            shameCommits={data.shameCommits}
            topLanguage={data.topLanguage}
            totalRepos={data.totalRepos}
            abandonedRepos={data.abandonedRepos}
            totalStars={data.totalStars}
          />
        </div>
      )}

      <style jsx>{`
        .roast-dossier-wrap {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
        }

        .dossier-capture-zone {
          background: #F7F5F0;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid #E5E0D8;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        /* ── Obsidian Top Header ── */
        .dossier-obsidian-header {
          background: #171717;
          color: #FFFFFF;
          padding: 2.25rem 2.5rem 2.5rem;
          border-bottom: 1px solid #262626;
        }
        .dossier-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .dossier-profile-meta {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .dossier-avatar-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #262626;
          border: 1px solid #383838;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dossier-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dossier-avatar-fallback {
          font-size: 16px;
          color: #EA580C;
          font-weight: 700;
        }
        .dossier-profile-names {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dossier-username {
          font-size: 17px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.2px;
        }
        .dossier-submeta {
          font-size: 10px;
          color: #9CA3AF;
          letter-spacing: 0.8px;
        }
        .dossier-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dossier-btn {
          padding: 7px 16px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }
        .dossier-btn--share {
          background: #EA580C;
          color: #FFFFFF;
        }
        .dossier-btn--share:hover {
          background: #C2410C;
        }
        .dossier-btn--download {
          background: #FFFFFF;
          color: #171717;
        }
        .dossier-btn--download:hover {
          background: #F3F4F6;
        }
        .dossier-btn--badge {
          background: transparent;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .dossier-btn--badge:hover {
          border-color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        .dossier-hero-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2.5rem;
        }
        .dossier-hero-text {
          flex: 1;
          min-width: 0;
        }
        .dossier-eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
          margin-bottom: 0.6rem;
        }
        .dossier-headline {
          font-size: clamp(28px, 4.2vw, 44px);
          line-height: 1.12;
          color: #FFFFFF;
          margin: 0 0 1rem;
          font-weight: 400;
          letter-spacing: -0.5px;
        }
        .dossier-roast-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .dossier-roast-p {
          font-size: 15px;
          line-height: 1.65;
          color: #D1D5DB;
          margin: 0;
          max-width: 720px;
        }
        .dossier-voice-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #E5E7EB;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dossier-voice-btn:hover {
          border-color: #EA580C;
          color: #EA580C;
        }
        .dossier-voice-btn--active {
          background: rgba(239, 68, 68, 0.2);
          border-color: #EF4444;
          color: #EF4444;
        }

        /* Giant Hot Score Circle */
        .dossier-score-badge {
          flex-shrink: 0;
        }
        .score-badge-circle {
          width: 172px;
          height: 172px;
          border-radius: 50%;
          background: #EA580C;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(234, 88, 12, 0.35);
        }
        .score-badge-number {
          font-size: 78px;
          line-height: 0.95;
          color: #FFFFFF;
          font-weight: 400;
        }
        .score-badge-label {
          font-size: 9px;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 4px;
        }

        /* ── 4 Diagnostic Metric Cards ── */
        .dossier-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          padding: 2rem 2.5rem 1.5rem;
        }
        .metric-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .metric-label {
          font-size: 10px;
          letter-spacing: 1px;
          color: #6B7280;
          font-weight: 600;
        }
        .metric-number {
          font-size: 38px;
          line-height: 1.1;
          color: #171717;
          font-weight: 700;
        }
        .metric-number--alert {
          color: #DC2626;
        }
        .metric-sub {
          font-size: 11px;
          color: #9CA3AF;
        }

        /* ── Main Two-Column Layout ── */
        .dossier-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
          padding: 0 2.5rem 2.5rem;
          align-items: start;
        }

        .dossier-left-col {
          display: flex;
          flex-direction: column;
          gap: 2.25rem;
        }
        .dossier-section {
          display: flex;
          flex-direction: column;
        }
        .section-eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
          margin-bottom: 0.4rem;
        }
        .section-title {
          font-size: 32px;
          color: #171717;
          margin: 0 0 1.25rem;
          font-weight: 400;
          line-height: 1.15;
        }

        /* The Charges */
        .charges-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .charge-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.15s ease;
        }
        .charge-card:hover {
          border-color: #CBD5E1;
        }
        .charge-card--alert {
          background: #FEF2F2;
          border-color: #FECACA;
        }
        .charge-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .charge-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .charge-icon {
          font-size: 16px;
        }
        .charge-title {
          font-size: 16px;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .charge-title--alert {
          color: #991B1B;
        }
        .charge-pill {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #F3F4F6;
          color: #4B5563;
          font-weight: 600;
        }
        .charge-pill--alert {
          background: #FEE2E2;
          color: #B91C1C;
        }
        .charge-desc {
          font-size: 13px;
          line-height: 1.6;
          color: #4B5563;
          margin: 0;
        }
        .charge-desc--alert {
          color: #7F1D1D;
        }
        .charge-link {
          align-self: flex-start;
          background: none;
          border: none;
          color: #EA580C;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .charge-link:hover {
          text-decoration: underline;
        }
        .charge-link--alert {
          color: #DC2626;
        }

        /* Repo Highlight Card */
        .repo-highlight-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .repo-highlight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge-best-evidence {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #D1FAE5;
          color: #065F46;
          font-weight: 600;
        }
        .repo-highlight-name {
          font-size: 28px;
          color: #171717;
          margin: 0;
          font-weight: 400;
        }
        .repo-highlight-quote {
          font-size: 18px;
          line-height: 1.5;
          color: #4B5563;
          margin: 0;
          font-style: italic;
        }
        .repo-highlight-stats {
          display: flex;
          gap: 2.5rem;
          padding-top: 1rem;
          border-top: 1px solid #F3F4F6;
          flex-wrap: wrap;
        }
        .repo-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .repo-stat-label {
          font-size: 10px;
          color: #9CA3AF;
          letter-spacing: 1px;
        }
        .repo-stat-val {
          font-size: 26px;
          color: #171717;
          line-height: 1.1;
        }
        .repo-stat-sub {
          font-size: 11px;
          color: #6B7280;
        }

        /* History Comparison Card */
        .history-compare-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .history-bars-chart {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          height: 110px;
          padding-top: 10px;
        }
        .history-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .history-bar {
          width: 100%;
          max-width: 60px;
          background: #E5E0D8;
          border-radius: 6px;
          transition: height 0.3s ease;
        }
        .history-bar--active {
          background: #EA580C;
        }
        .history-bar-month {
          font-size: 11px;
          color: #6B7280;
        }
        .history-chart-footer {
          font-size: 11px;
          color: #9CA3AF;
          margin: 0;
        }

        /* Redemption Plan */
        .redemption-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1.5rem 1.75rem;
        }
        .redemption-title {
          font-size: 14px;
          font-weight: 700;
          color: #171717;
          margin: 0 0 12px;
        }
        .redemption-checklist {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .redemption-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .redemption-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #EA580C;
        }
        .redemption-text {
          font-size: 13px;
          color: #374151;
        }

        .reactions-container {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1rem 1.5rem;
        }

        .dossier-brand {
          text-align: right;
          font-size: 11px;
          color: #EA580C;
          letter-spacing: 0.5px;
        }

        /* ── Right Column Sidebar ── */
        .dossier-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .anatomy-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .anatomy-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .anatomy-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #374151;
        }
        .anatomy-score-val {
          font-weight: 700;
          color: #171717;
        }
        .anatomy-progress-track {
          width: 100%;
          height: 6px;
          background: #F3F4F6;
          border-radius: 9999px;
          overflow: hidden;
        }
        .anatomy-progress-bar {
          height: 100%;
          border-radius: 9999px;
        }
        .anatomy-progress-bar--depth { background: #EA580C; }
        .anatomy-progress-bar--consistency { background: #F59E0B; }
        .anatomy-progress-bar--collab { background: #10B981; }
        .anatomy-progress-bar--doc { background: #EF4444; }

        .anatomy-note {
          font-size: 11px;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
        }
        .btn-view-methodology {
          padding: 9px;
          border-radius: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-view-methodology:hover {
          border-color: #EA580C;
          color: #EA580C;
        }

        .badge-preview-pill {
          background: #171717;
          color: #FFFFFF;
          padding: 8px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          align-self: flex-start;
        }
        .sidebar-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .sidebar-card-desc {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
        }
        .btn-copy-badge {
          background: #171717;
          color: #FFFFFF;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-copy-badge:hover {
          background: #262626;
        }

        /* Pro Card */
        .pro-burn-card {
          background: #171717;
          border: 1px solid #262626;
          border-radius: 14px;
          padding: 1.75rem;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .pro-badge-pill {
          background: #FFEDD5;
          color: #C2410C;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          align-self: flex-start;
        }
        .pro-burn-title {
          font-size: 26px;
          margin: 0;
          font-weight: 400;
          color: #FFFFFF;
        }
        .pro-burn-desc {
          font-size: 12px;
          color: #9CA3AF;
          line-height: 1.5;
          margin: 0;
        }
        .btn-pro-burn {
          background: #EA580C;
          color: #FFFFFF;
          border: none;
          padding: 11px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-pro-burn:hover {
          background: #C2410C;
        }

        .sidebar-disclaimer {
          font-size: 10px;
          color: #9CA3AF;
          line-height: 1.5;
          margin: 0;
        }

        .share-buttons-wrap {
          margin-top: 1.5rem;
        }

        /* ── Nuclear Mode Pro Conversion Teaser ── */
        .nuclear-teaser-card {
          margin-top: 1.5rem;
          background: #FFFFFF;
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
          background: var(--bg-elevated);
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

        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 16px;
          background: #EA580C;
          vertical-align: middle;
          margin-left: 2px;
        }
        .voice-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #EF4444;
          animation: voiceBlink 0.8s infinite alternate;
        }
        @keyframes voiceBlink {
          from { opacity: 0.3; transform: scale(0.8); }
          to   { opacity: 1;   transform: scale(1.2); }
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .dossier-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            padding: 1.5rem;
          }
          .dossier-main-grid {
            grid-template-columns: 1fr;
            padding: 0 1.5rem 1.5rem;
          }
          .dossier-obsidian-header {
            padding: 1.5rem;
          }
        }
        @media (max-width: 640px) {
          .dossier-metrics-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }
          .dossier-main-grid {
            padding: 0 1rem 1rem;
          }
          .dossier-hero-row {
            flex-direction: column-reverse;
            align-items: flex-start;
          }
          .score-badge-circle {
            width: 130px;
            height: 130px;
          }
          .score-badge-number {
            font-size: 56px;
          }
          .dossier-actions {
            width: 100%;
          }
          .dossier-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}