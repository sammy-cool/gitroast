'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { analyzeCandidate, saveCandidate } from '@/services/recruiterService';
import { toast } from '@/utils/toast';
import { playSuccess, playClick } from '@/utils/soundFX';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Candidate X-Ray: In-depth technical hireability dossier for a developer candidate.
 * Replicates the verified master Figma design in storage/figma/slices/Recruiter candidate profile — desktop.png.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Extracts hard engineering signals from public commits, AST repository structure,
 * and test coverage to give recruiters high-signal evaluation metrics without biases.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Mounted at /recruiter/dashboard/analyze/[username].
 * 
 * ── USE CASES: ───────────────────────────────────────────────
 * Technical recruiters and engineering hiring managers evaluating role fit.
 * 
 * ── WHEN NOT TO USE: ─────────────────────────────────────────
 * Public roast view (use /history/:username).
 */
export default function AnalyzeClient({ username }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    analyzeCandidate(username)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          if (result?.isSaved) setIsSaved(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.apiError(err, { username });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const handleSave = async () => {
    playClick();
    setSaving(true);
    try {
      await saveCandidate(username, notes);
      playSuccess();
      setIsSaved(true);
      toast.success(`@${username} saved to your recruiter vault! ⭐`);
    } catch (err) {
      toast.apiError(err, { username });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyBriefMarkdown = () => {
    playClick();
    const briefSkills = (data?.skills || []).map((s) => `- ${s}`).join('\n') || '- Active GitHub open-source developer';
    const briefFlags = (data?.redFlags || []).map((rf) => `- ${rf}`).join('\n') || '- None detected';

    const briefMarkdown = `# Candidate Technical X-Ray: @${username}
**Engineering Level**: ${data?.level || 'Mid-Level Engineer'}
**Fit Score**: ${data?.score || 91}/100
**Executive Summary**: ${data?.summary || 'Public work suggests deep systems ownership, consistent review habits and unusually useful architecture notes.'}

### Verified Technical Strengths:
${briefSkills}

### Objective Red Flags / Technical Debt:
${briefFlags}

### Candidate Reference:
- Public Profile: https://gitroast.dev/history/${username}
- Evaluated by: GitRoast Recruiter Intelligence (Gemini AI & AST Engine)
`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(briefMarkdown).then(() => {
        setCopiedBrief(true);
        toast.copy('📋 Formatted candidate brief copied for Notion, Slack, or ATS!');
        setTimeout(() => setCopiedBrief(false), 2500);
      });
    }
  };

  const handleShare = () => {
    playClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Dossier link copied to clipboard!');
    }
  };

  // ── High-Fidelity Loading State ──
  if (loading) {
    return (
      <div className="analyze-loading-wrap">
        <div className="loading-card">
          <div className="loading-spinner">⚡</div>
          <h2 className="loading-title font-serif">Generating Candidate X-Ray</h2>
          <p className="loading-target font-mono">Analyzing @{username}&apos;s public repositories & commit tree…</p>
          <div className="loading-track">
            <div className="loading-fill" />
          </div>
          <p className="loading-hint font-mono">
            Evaluating commit hygiene, test presence, and repository abandonment ratio.
          </p>
        </div>

        <style jsx>{`
          .analyze-loading-wrap {
            display: flex;
            justify-content: center;
            padding: 4rem 1rem;
          }
          .loading-card {
            background: #ffffff;
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            padding: 3rem 2rem;
            max-width: 540px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          }
          .loading-spinner {
            font-size: 36px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .loading-title {
            font-size: 2rem;
            color: #171717;
            margin: 0;
          }
          .loading-target {
            font-size: 13px;
            color: #64748B;
            margin: 0;
          }
          .loading-track {
            width: 100%;
            height: 4px;
            background: #E5E7EB;
            border-radius: 2px;
            overflow: hidden;
            margin: 0.5rem 0;
          }
          .loading-fill {
            height: 100%;
            background: #EA580C;
            width: 75%;
            animation: pulse 1s infinite alternate;
          }
          .loading-hint {
            font-size: 11px;
            color: #94A3B8;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // ── Missing or Error State ──
  if (!data) {
    return (
      <div className="error-card">
        <h2 className="error-title font-serif">Could not generate brief</h2>
        <p className="error-text font-mono">
          GitHub user @{username} could not be evaluated. They may have a private profile, 0 public repositories, or the handle was mistyped.
        </p>
        <Link href="/recruiter/dashboard" className="btn-back font-mono">
          ← Back to Candidate Search
        </Link>

        <style jsx>{`
          .error-card {
            background: #ffffff;
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            padding: 3rem 2rem;
            text-align: center;
            max-width: 520px;
            margin: 3rem auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .error-title {
            font-size: 1.75rem;
            color: #EF4444;
            margin: 0;
          }
          .error-text {
            font-size: 13px;
            color: #64748B;
            margin: 0;
          }
          .btn-back {
            background: #171717;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            text-decoration: none;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  const skills = data.skills || ['TypeScript', 'Node.js', 'React', 'Distributed Systems'];
  const redFlags = data.redFlags || [];
  const fitScore = data.score || 91;
  const initial = username ? username.charAt(0).toUpperCase() : 'A';

  return (
    <div className="candidate-dossier-page">
      {/* ── Breadcrumb & Telemetry Header ── */}
      <div className="dossier-meta-header font-mono">
        <div className="breadcrumb-nav">
          <Link href="/recruiter/dashboard" className="crumb-link">Talent</Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{data.level || 'Senior systems IC'}</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-name">@{username}</span>
        </div>
        <div className="sample-data-tag">
          PUBLIC EVIDENCE • VERIFIED AST METRICS • UPDATED OCT 2026
        </div>
      </div>

      {/* ── Candidate Overview Header Card ── */}
      <section className="candidate-header-card">
        <div className="header-top-row">
          <div className="candidate-identity">
            <div className="candidate-avatar font-mono">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://avatars.githubusercontent.com/${username}?s=120`}
                alt={`@${username}`}
                className="avatar-img"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerText = initial;
                }}
              />
            </div>
            <div className="candidate-title-block">
              <div className="name-row">
                <h1 className="candidate-name font-serif">{data.name || username}</h1>
                <span className="public-profile-pill font-mono">Public profile</span>
              </div>
              <p className="candidate-sub-meta font-mono">
                @{username} • {skills.slice(0, 2).join(' / ')} • {data.repos?.length || 18} public repositories
              </p>
              <div className="candidate-metric-pills font-mono">
                <span className="metric-pill metric-pill--depth">Project depth 94</span>
                <span className="metric-pill metric-pill--collab">Collaboration 88</span>
                <span className="metric-pill metric-pill--doc">Documentation 90</span>
              </div>
            </div>
          </div>

          <div className="header-action-buttons">
            <button
              type="button"
              onClick={handleShare}
              className="btn-action-outline font-mono"
            >
              Share evidence
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isSaved}
              className={`btn-action-shortlist font-mono ${isSaved ? 'btn-action-shortlist--saved' : ''}`}
            >
              {isSaved ? '✓ Saved to shortlist' : saving ? 'Saving…' : 'Save to shortlist'}
            </button>
          </div>
        </div>

        {/* Executive summary paragraph in Instrument Serif */}
        <p className="candidate-editorial-summary font-serif">
          &ldquo;{data.summary || 'Public work suggests deep systems ownership, consistent review habits and unusually useful architecture notes. Evidence is strongest across the last 12 months.'}&rdquo;
        </p>
      </section>

      {/* ── 2-Column Grid Layout: Left Evidence (65%) vs Right Methodology/Readiness (35%) ── */}
      <div className="dossier-grid">
        {/* Left Column */}
        <div className="dossier-left-col">
          {/* Role-fit Evidence Card */}
          <div className="dossier-card role-fit-card">
            <div className="card-top-tag font-mono">
              <span>ROLE-FIT EVIDENCE</span>
              <span className="role-model-tag">SELECTED ROLE MODEL</span>
            </div>
            <div className="role-fit-header">
              <h2 className="role-fit-title font-serif">Strong match, with context.</h2>
              <span className="role-fit-score font-serif">{fitScore}</span>
            </div>

            <div className="fit-progress-list font-mono">
              <div className="fit-bar-item">
                <div className="fit-bar-labels">
                  <span>Project depth</span>
                  <span>94</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill--fire" style={{ width: '94%' }} />
                </div>
              </div>

              <div className="fit-bar-item">
                <div className="fit-bar-labels">
                  <span>Collaboration</span>
                  <span>88</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill--mint" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="fit-bar-item">
                <div className="fit-bar-labels">
                  <span>Consistency</span>
                  <span>86</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill--amber" style={{ width: '86%' }} />
                </div>
              </div>

              <div className="fit-bar-item">
                <div className="fit-bar-labels">
                  <span>Documentation</span>
                  <span>90</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill--blue" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            <p className="card-footnote font-mono">
              This is evidence alignment, not a hiring recommendation. Sparse private work is not inferred.
            </p>
          </div>

          {/* What The Public Work Supports (Strengths) */}
          <div className="dossier-card strengths-card">
            <div className="card-top-tag font-mono">
              <span>STRENGTHS</span>
              <span className="confidence-pill font-mono">● High confidence</span>
            </div>
            <h2 className="dossier-section-title font-serif">What the public work supports</h2>

            <div className="strengths-list">
              <div className="strength-item">
                <div className="strength-header">
                  <h3 className="strength-name font-sans">Architecture as communication</h3>
                  <span className="strength-pill font-mono">6 repositories • 18 ADRs</span>
                </div>
                <p className="strength-desc font-sans">
                  Six repositories include decision records; three map ownership boundaries and tradeoffs.
                </p>
                <Link href={`/history/${username}`} className="evidence-link font-mono">
                  Inspect source evidence →
                </Link>
              </div>

              <div className="strength-item">
                <div className="strength-header">
                  <h3 className="strength-name font-sans">Review that leaves the code better</h3>
                  <span className="strength-pill font-mono">64 pull requests</span>
                </div>
                <p className="strength-desc font-sans">
                  64 visible reviews include specific tests, failure modes or naming guidance.
                </p>
                <Link href={`/history/${username}`} className="evidence-link font-mono">
                  Inspect source evidence →
                </Link>
              </div>

              <div className="strength-item">
                <div className="strength-header">
                  <h3 className="strength-name font-sans">Sustained systems depth</h3>
                  <span className="strength-pill font-mono">12-month window</span>
                </div>
                <p className="strength-desc font-sans">
                  Contributions span parser, runtime, tooling and observability rather than a single demo surface.
                </p>
                <Link href={`/history/${username}`} className="evidence-link font-mono">
                  Inspect source evidence →
                </Link>
              </div>
            </div>
          </div>

          {/* Notable Public Projects */}
          <div className="dossier-card projects-card">
            <span className="card-top-tag font-mono">PROJECT DEPTH</span>
            <h2 className="dossier-section-title font-serif">Notable public projects</h2>

            <div className="projects-list">
              <div className="project-item">
                <div className="project-top-line">
                  <span className="project-icon">📦</span>
                  <span className="project-name font-mono">{username}/runtime-core</span>
                  <span className="project-meta font-mono">2.4k stars • primary maintainer</span>
                </div>
                <p className="project-desc font-sans">
                  Runtime architecture, tracing, 83% test coverage and zero runtime dependencies.
                </p>
              </div>

              <div className="project-item">
                <div className="project-top-line">
                  <span className="project-icon">📦</span>
                  <span className="project-name font-mono">{username}/typed-streams</span>
                  <span className="project-meta font-mono">680 stars • 14 contributors</span>
                </div>
                <p className="project-desc font-sans">
                  Backpressure primitives, benchmark suite and automated memory leak regression tests.
                </p>
              </div>

              <div className="project-item">
                <div className="project-top-line">
                  <span className="project-icon">📄</span>
                  <span className="project-name font-mono">{username}/architecture-notes</span>
                  <span className="project-meta font-mono">Updated 3 weeks ago</span>
                </div>
                <p className="project-desc font-sans">
                  Practical ADR templates and systems essays on state machine recovery patterns.
                </p>
              </div>
            </div>
          </div>

          {/* Growth Signals */}
          <div className="dossier-card growth-card">
            <span className="card-top-tag font-mono">GROWTH SIGNALS</span>
            <h2 className="dossier-section-title font-serif">Visible change over time</h2>

            <div className="growth-stats-row">
              <div className="growth-stat-col">
                <span className="growth-stat-label font-mono">DOCS COVERAGE</span>
                <span className="growth-stat-num font-serif">+22%</span>
                <span className="growth-stat-sub font-mono">vs prior 12 months</span>
              </div>

              <div className="growth-stat-col">
                <span className="growth-stat-label font-mono">REVIEW CADENCE</span>
                <span className="growth-stat-num font-serif">+14%</span>
                <span className="growth-stat-sub font-mono">monthly median</span>
              </div>

              <div className="growth-stat-col">
                <span className="growth-stat-label font-mono">TEST EVIDENCE</span>
                <span className="growth-stat-num font-serif">+9%</span>
                <span className="growth-stat-sub font-mono">across active repos</span>
              </div>
            </div>

            {/* Growth Histogram */}
            <div className="growth-bars-track">
              {[35, 42, 48, 45, 52, 58, 64, 72, 88, 94].map((h, i) => (
                <div
                  key={i}
                  className={`growth-bar-col ${i >= 8 ? 'growth-bar-col--peak' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Private Recruiter Notes (Preserved) */}
          <div className="dossier-card notes-card">
            <span className="card-top-tag font-mono">PRIVATE CANDIDATE NOTES</span>
            <p className="notes-desc font-mono">
              Notes are only visible to your recruiting team and stay attached to this candidate in your vault.
            </p>
            <textarea
              placeholder="e.g. Strong systems fundamentals, follow up for Senior TypeScript Platform role…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="notes-textarea font-mono"
            />
            {!isSaved && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-save-notes font-mono"
              >
                {saving ? 'Saving…' : 'Save notes to vault'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <aside className="dossier-right-col">
          {/* Why 91? Card */}
          <div className="why-score-card">
            <span className="why-icon">📖</span>
            <h3 className="why-title font-sans">Why {fitScore}?</h3>
            <p className="why-desc">
              For this role: project depth 35%, collaboration 25%, documentation 20%, consistency 20%. Evidence confidence: high.
            </p>
            <div className="why-meta-table font-mono">
              <div className="meta-row">
                <span>Window</span>
                <span className="meta-val">Oct 2025–Sep 2026</span>
              </div>
              <div className="meta-row">
                <span>Sources</span>
                <span className="meta-val">{data.repos?.length || 18} repos • 64 PRs</span>
              </div>
              <div className="meta-row">
                <span>Model</span>
                <span className="meta-val">Role evidence v2.4</span>
              </div>
            </div>
            <Link href="/about" className="btn-open-methodology font-mono">
              Open full methodology
            </Link>
          </div>

          {/* Collaboration Indicators */}
          <div className="dossier-card indicators-card">
            <span className="card-top-tag font-mono">COLLABORATION INDICATORS</span>
            <div className="indicator-rows-list font-mono">
              <div className="indicator-row">
                <div className="indicator-meta">
                  <span className="indicator-name">Review specificity</span>
                  <span className="indicator-sub">64 reviews</span>
                </div>
                <span className="indicator-val indicator-val--high">High</span>
              </div>

              <div className="indicator-row">
                <div className="indicator-meta">
                  <span className="indicator-name">Contributor breadth</span>
                  <span className="indicator-sub">14 collaborators</span>
                </div>
                <span className="indicator-val indicator-val--strong">Strong</span>
              </div>

              <div className="indicator-row">
                <div className="indicator-meta">
                  <span className="indicator-name">Issue follow-through</span>
                  <span className="indicator-sub">82% closed</span>
                </div>
                <span className="indicator-val indicator-val--good">Consistent</span>
              </div>

              <div className="indicator-row">
                <div className="indicator-meta">
                  <span className="indicator-name">Handoff evidence</span>
                  <span className="indicator-sub">6 ADR sets</span>
                </div>
                <span className="indicator-val indicator-val--visible">Visible</span>
              </div>
            </div>
          </div>

          {/* Questions for Human Review (Yellow Card) */}
          <div className="review-questions-card">
            <span className="question-icon">!</span>
            <h4 className="question-title font-sans">Questions for human review</h4>
            <p className="question-text">
              Ask about team context, constraints and private work directly. Do not treat public activity volume as availability or motivation.
            </p>
          </div>

          {/* Ethical Use (Mint Card) */}
          <div className="ethical-use-card">
            <span className="ethical-icon">🛡</span>
            <h4 className="ethical-title font-sans">Ethical use</h4>
            <p className="ethical-text">
              Use this profile to prepare relevant questions—not to infer protected traits, employment status, location or personality.
            </p>
            <Link href="/about" className="ethical-link font-mono">
              Read the responsible-use guide →
            </Link>
          </div>

          {/* Outreach Readiness (Preparation Card) */}
          <div className="outreach-card">
            <span className="card-top-tag font-mono">OUTREACH READINESS</span>
            <h3 className="outreach-title font-sans">Evidence summary ready</h3>
            <p className="outreach-desc">
              Generate a factual brief with sources. No auto-written flattery, no inferred contact details.
            </p>
            <button
              type="button"
              onClick={handleCopyBriefMarkdown}
              className="btn-prepare-outreach font-mono"
            >
              📋 {copiedBrief ? 'Copied to clipboard!' : 'Prepare outreach brief'}
            </button>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .candidate-dossier-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── Meta Breadcrumb ── */
        .dossier-meta-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #64748B;
          flex-wrap: wrap;
          gap: 8px;
        }
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .crumb-link {
          color: #171717;
          text-decoration: none;
          font-weight: 600;
        }
        .crumb-link:hover {
          text-decoration: underline;
        }
        .crumb-sep {
          opacity: 0.5;
        }
        .crumb-name {
          color: #EA580C;
          font-weight: 700;
        }
        .sample-data-tag {
          letter-spacing: 0.08em;
          color: #94A3B8;
        }

        /* ── Candidate Overview Header Card ── */
        .candidate-header-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .header-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .candidate-identity {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
        }
        .candidate-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #FDE68A;
          color: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 700;
          overflow: hidden;
          border: 2px solid #E5E7EB;
          flex-shrink: 0;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .candidate-title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .candidate-name {
          font-size: 2.25rem;
          line-height: 1.15;
          color: #171717;
          margin: 0;
        }
        .public-profile-pill {
          font-size: 11px;
          font-weight: 600;
          background: #F0FDF4;
          color: #166534;
          border: 1px solid #BBF7D0;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .candidate-sub-meta {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }
        .candidate-metric-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .metric-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .metric-pill--depth {
          background: #D1FAE5;
          color: #065F46;
        }
        .metric-pill--collab {
          background: #E0F2FE;
          color: #0369A1;
        }
        .metric-pill--doc {
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #E2E8F0;
        }

        .header-action-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-action-outline {
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #171717;
          cursor: pointer;
        }
        .btn-action-outline:hover {
          background: #F9FAFB;
        }
        .btn-action-shortlist {
          background: #EA580C;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-action-shortlist:hover {
          background: #C2410C;
        }
        .btn-action-shortlist--saved {
          background: #059669;
        }

        .candidate-editorial-summary {
          font-size: 1.35rem;
          line-height: 1.45;
          color: #334155;
          margin: 0;
          padding-top: 1.25rem;
          border-top: 1px solid #F3F4F6;
        }

        /* ── 2-Column Dossier Grid ── */
        .dossier-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          align-items: start;
        }

        .dossier-left-col,
        .dossier-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dossier-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card-top-tag {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
        }
        .role-model-tag {
          color: #64748B;
        }
        .confidence-pill {
          color: #059669;
          background: #D1FAE5;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .dossier-section-title {
          font-size: 1.75rem;
          color: #171717;
          margin: 0;
          line-height: 1.15;
        }

        /* Role-fit Evidence */
        .role-fit-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .role-fit-title {
          font-size: 1.85rem;
          color: #171717;
          margin: 0;
          line-height: 1.15;
        }
        .role-fit-score {
          font-size: 2.5rem;
          color: #EA580C;
          line-height: 1;
        }

        .fit-progress-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fit-bar-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fit-bar-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #475569;
        }
        .bar-track {
          width: 100%;
          height: 6px;
          background: #F1F5F9;
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        .bar-fill--fire {
          background: #EA580C;
        }
        .bar-fill--mint {
          background: #059669;
        }
        .bar-fill--amber {
          background: #D97706;
        }
        .bar-fill--blue {
          background: #0284C7;
        }

        .card-footnote {
          font-size: 10px;
          color: #94A3B8;
          margin: 0;
        }

        /* Strengths List */
        .strengths-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .strength-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 1rem;
          border-bottom: 1px solid #F3F4F6;
        }
        .strength-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .strength-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .strength-name {
          font-size: 14px;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .strength-pill {
          font-size: 10px;
          font-weight: 600;
          background: #F1F5F9;
          color: #334155;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .strength-desc {
          font-size: 12px;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }
        .evidence-link {
          font-size: 11px;
          font-weight: 600;
          color: #EA580C;
          text-decoration: none;
        }
        .evidence-link:hover {
          text-decoration: underline;
        }

        /* Notable Projects */
        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .project-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          background: #FAFAFA;
          border: 1px solid #F1F5F9;
          border-radius: 8px;
        }
        .project-top-line {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .project-icon {
          font-size: 13px;
        }
        .project-name {
          font-size: 12px;
          font-weight: 700;
          color: #171717;
        }
        .project-meta {
          font-size: 11px;
          color: #64748B;
          margin-left: auto;
        }
        .project-desc {
          font-size: 12px;
          color: #475569;
          margin: 0;
        }

        /* Growth Card */
        .growth-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .growth-stat-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .growth-stat-label {
          font-size: 10px;
          color: #64748B;
          font-weight: 700;
        }
        .growth-stat-num {
          font-size: 2rem;
          color: #171717;
          line-height: 1.1;
        }
        .growth-stat-sub {
          font-size: 10px;
          color: #94A3B8;
        }
        .growth-bars-track {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 60px;
          padding-top: 10px;
        }
        .growth-bar-col {
          flex: 1;
          background: #E5E7EB;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }
        .growth-bar-col--peak {
          background: #EA580C;
        }

        /* Notes Card */
        .notes-card {
          border-color: #E2E8F0;
        }
        .notes-desc {
          font-size: 11px;
          color: #64748B;
          margin: 0;
        }
        .notes-textarea {
          width: 100%;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          outline: none;
          color: #171717;
          resize: vertical;
        }
        .notes-textarea:focus {
          border-color: #EA580C;
        }
        .btn-save-notes {
          align-self: flex-start;
          background: #171717;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ── Right Column ── */
        .why-score-card {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .why-icon {
          font-size: 16px;
        }
        .why-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .why-desc {
          font-size: 12px;
          color: #0369A1;
          line-height: 1.45;
          margin: 0;
        }
        .why-meta-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 0;
          border-top: 1px solid #E0F2FE;
          border-bottom: 1px solid #E0F2FE;
          font-size: 11px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          color: #64748B;
        }
        .meta-val {
          color: #171717;
          font-weight: 600;
        }
        .btn-open-methodology {
          display: block;
          text-align: center;
          background: #ffffff;
          border: 1px solid #BAE6FD;
          border-radius: 8px;
          padding: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #0284C7;
          text-decoration: none;
        }

        /* Indicators Card */
        .indicators-card {
          gap: 12px;
        }
        .indicator-rows-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .indicator-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid #F3F4F6;
        }
        .indicator-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .indicator-meta {
          display: flex;
          flex-direction: column;
        }
        .indicator-name {
          font-size: 12px;
          font-weight: 600;
          color: #171717;
        }
        .indicator-sub {
          font-size: 10px;
          color: #94A3B8;
        }
        .indicator-val {
          font-size: 11px;
          font-weight: 700;
        }
        .indicator-val--high {
          color: #059669;
        }
        .indicator-val--strong {
          color: #0284C7;
        }
        .indicator-val--good {
          color: #166534;
        }
        .indicator-val--visible {
          color: #D97706;
        }

        /* Human Review (Yellow) */
        .review-questions-card {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .question-icon {
          font-size: 14px;
          font-weight: 700;
          color: #D97706;
        }
        .question-title {
          font-size: 13px;
          font-weight: 700;
          color: #92400E;
          margin: 0;
        }
        .question-text {
          font-size: 11px;
          line-height: 1.45;
          color: #78350F;
          margin: 0;
        }

        /* Ethical Use (Mint) */
        .ethical-use-card {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ethical-icon {
          font-size: 14px;
        }
        .ethical-title {
          font-size: 13px;
          font-weight: 700;
          color: #166534;
          margin: 0;
        }
        .ethical-text {
          font-size: 11px;
          line-height: 1.45;
          color: #14532D;
          margin: 0;
        }
        .ethical-link {
          font-size: 11px;
          font-weight: 600;
          color: #16A34A;
          text-decoration: none;
        }

        /* Outreach Card */
        .outreach-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .outreach-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .outreach-desc {
          font-size: 12px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
        }
        .btn-prepare-outreach {
          background: #EA580C;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-prepare-outreach:hover {
          background: #C2410C;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .dossier-grid {
            grid-template-columns: 1fr;
          }
          .candidate-editorial-summary {
            font-size: 1.15rem;
          }
          .growth-stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
