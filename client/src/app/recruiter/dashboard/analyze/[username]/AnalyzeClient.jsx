'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { analyzeCandidate, saveCandidate } from '@/services/recruiterService';
import { toast } from '@/utils/toast';
import { playSuccess, playClick } from '@/utils/soundFX';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Candidate X-Ray: In-depth technical hireability brief for a developer candidate.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Extracts hard engineering signals from public commits, AST repository structure,
 * and test coverage to give recruiters high-signal evaluation metrics.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Mounted at /recruiter/dashboard/analyze/[username].
 */
export default function AnalyzeClient({ username }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

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

  // ── High-Fidelity Loading State (Eradicates ISSUE-06 naked text) ──
  if (loading) {
    return (
      <div className="analyze-loading-wrap">
        <div className="card loading-card">
          <div className="loading-spinner">⚡</div>
          <h2 className="loading-title font-display">GENERATING CANDIDATE X-RAY</h2>
          <p className="loading-target font-mono">Analyzing @{username}&apos;s public repositories & commit tree...</p>
          <div className="loading-track">
            <div className="loading-fill animate-pulse" />
          </div>
          <p className="loading-hint font-mono">
            Evaluating commit hygiene, test presence, and repository abandonment ratio.
          </p>
        </div>

        <style jsx>{`
          .analyze-loading-wrap {
            display: flex;
            justify-content: center;
            padding: 3rem 1rem;
          }
          .loading-card {
            background: var(--bg-card, #FFFFFF);
            border: 1px solid var(--recruiter-border, #BAE6FD);
            border-radius: var(--radius-lg, 16px);
            padding: 3rem 2rem;
            max-width: 540px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 8px 30px rgba(2, 132, 199, 0.08);
          }
          .loading-spinner {
            font-size: 36px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .loading-title {
            font-size: 1.75rem;
            color: var(--recruiter-blue, #0284C7);
            margin: 0;
          }
          .loading-target {
            font-size: 14px;
            color: var(--text-primary, #0F172A);
            margin: 0;
          }
          .loading-track {
            width: 100%;
            height: 4px;
            background: var(--border, #E2E8F0);
            border-radius: 2px;
            overflow: hidden;
            margin: 0.5rem 0;
          }
          .loading-fill {
            height: 100%;
            background: var(--recruiter-grad, linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%));
            width: 100%;
          }
          .loading-hint {
            font-size: 12px;
            color: var(--text-muted, #64748B);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // ── Missing or Error State ──
  if (!data) {
    return (
      <div className="card error-card">
        <h2 className="error-title font-display">COULD NOT GENERATE BRIEF</h2>
        <p className="error-text">
          GitHub user @{username} could not be evaluated. They may have a private profile, 0 public repositories, or the handle was mistyped.
        </p>
        <Link href="/recruiter/dashboard" className="btn btn-back font-mono">
          ← Back to Candidate Search
        </Link>

        <style jsx>{`
          .error-card {
            background: var(--bg-card, #FFFFFF);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: var(--radius-lg, 16px);
            padding: 3rem 2rem;
            text-align: center;
            max-width: 520px;
            margin: 2rem auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .error-title {
            font-size: 1.5rem;
            color: var(--bad, #EF4444);
            margin: 0;
          }
          .error-text {
            font-size: 14px;
            color: var(--text-secondary, #475569);
            margin: 0;
          }
          .btn-back {
            background: var(--bg-subtle, #F1F5F9);
            color: var(--text-primary, #0F172A);
            padding: 10px 18px;
            border-radius: var(--radius-md, 10px);
            font-size: 13px;
            text-decoration: none;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  const skills = data.skills || [];
  const redFlags = data.redFlags || [];

  return (
    <div className="analyze-page">
      {/* ── Candidate Overview Header Card ── */}
      <section className="card candidate-header-card">
        <div className="candidate-profile-row">
          <div className="avatar-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://avatars.githubusercontent.com/${username}?s=140`}
              alt={username}
              className="candidate-avatar"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>
          <div className="candidate-meta">
            <div className="title-row">
              <h1 className="candidate-handle font-display">@{username}</h1>
              <span className="seniority-tag font-mono">
                {data.level || 'Mid-Level Engineer'}
              </span>
            </div>
            <p className="candidate-bio">
              {data.summary || 'Public GitHub metadata extracted and evaluated with Gemini 3.1 Pro engine.'}
            </p>
          </div>
        </div>

        <div className="header-action-row">
          <Link href={`/history/${username}`} target="_blank" className="btn btn-outline font-mono">
            View Public Roast Report ↗
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isSaved}
            className={`btn btn-save font-mono ${isSaved ? 'btn-save--saved' : ''}`}
          >
            {isSaved ? '✓ Saved in Recruiter Vault' : saving ? 'Saving...' : '⭐ Bookmark Candidate'}
          </button>
        </div>
      </section>

      {/* ── Signal Matrix Cards ── */}
      <div className="brief-grid">
        {/* Top Verified Skills */}
        <section className="card brief-card">
          <div className="card-header font-mono">
            <span className="card-tag">VERIFIED SKILLS</span>
            <span className="card-icon">⚡</span>
          </div>
          <h2 className="card-title font-display">PRIMARY TECHNICAL STRENGTHS</h2>
          <div className="skills-cloud">
            {skills.length > 0 ? (
              skills.map((skill, idx) => (
                <span key={idx} className="skill-pill font-mono">
                  {skill}
                </span>
              ))
            ) : (
              <p className="empty-text">No distinct primary language detected.</p>
            )}
          </div>
        </section>

        {/* Objective Red Flags */}
        <section className="card brief-card brief-card--warning">
          <div className="card-header font-mono">
            <span className="card-tag card-tag--warn">ENGINEERING SINS</span>
            <span className="card-icon">⚠</span>
          </div>
          <h2 className="card-title font-display">CONSTRUCTIVE RED FLAGS</h2>
          <div className="flags-list font-mono">
            {redFlags.length > 0 ? (
              redFlags.map((flag, idx) => (
                <div key={idx} className="flag-item">
                  <span className="flag-bullet">✗</span>
                  <span className="flag-text">{flag}</span>
                </div>
              ))
            ) : (
              <p className="empty-text">No significant commit or testing red flags detected!</p>
            )}
          </div>
        </section>
      </div>

      {/* ── Recruiter Private Notes Section ── */}
      <section className="card notes-card">
        <h3 className="notes-title font-display">PRIVATE CANDIDATE NOTES</h3>
        <p className="notes-desc">
          Notes are only visible to your recruiting team and will be saved alongside this profile.
        </p>
        <textarea
          placeholder="e.g. Strong React fundamentals, follow up for Senior Frontend interview..."
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
            className="btn btn-save-notes font-mono"
          >
            {saving ? 'Saving...' : 'Save Notes & Candidate'}
          </button>
        )}
      </section>

      <style jsx>{`
        .analyze-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        /* ── Header Card ── */
        .candidate-header-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          border-radius: var(--radius-lg, 16px);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.06);
        }

        .candidate-profile-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar-wrap {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--recruiter-border, #BAE6FD);
          flex-shrink: 0;
        }

        .candidate-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .candidate-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .candidate-handle {
          font-size: 2rem;
          margin: 0;
          color: var(--text-primary, #0F172A);
          letter-spacing: 0.5px;
        }

        .seniority-tag {
          font-size: 11px;
          font-weight: 700;
          background: var(--recruiter-subtle, #F0F9FF);
          color: var(--recruiter-blue, #0284C7);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          padding: 4px 10px;
          border-radius: var(--radius-pill, 9999px);
        }

        .candidate-bio {
          font-size: 14px;
          color: var(--text-secondary, #475569);
          margin: 0;
          max-width: 650px;
        }

        .header-action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--border, #E2E8F0);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border, #E2E8F0);
          color: var(--text-secondary, #475569);
          padding: 10px 18px;
          border-radius: var(--radius-md, 10px);
          font-size: 13px;
          text-decoration: none;
          transition: all 0.15s;
        }

        .btn-outline:hover {
          border-color: var(--recruiter-blue, #0284C7);
          color: var(--recruiter-blue, #0284C7);
        }

        .btn-save {
          background: var(--recruiter-grad, linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%));
          color: #FFFFFF;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-md, 10px);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-save--saved {
          background: var(--state-success, #10B981);
          cursor: default;
        }

        /* ── Grid ── */
        .brief-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .brief-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.05));
        }

        .brief-card--warning {
          border-color: #FED7AA;
          background: #FFFDFB;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }

        .card-tag {
          color: var(--recruiter-blue, #0284C7);
          font-weight: 700;
        }

        .card-tag--warn {
          color: var(--warn, #F59E0B);
        }

        .card-title {
          font-size: 1.25rem;
          margin: 0;
          color: var(--text-primary, #0F172A);
        }

        .skills-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-pill {
          background: var(--recruiter-subtle, #F0F9FF);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          color: var(--recruiter-dark, #0369A1);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: var(--radius-sm, 8px);
        }

        .flags-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .flag-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
        }

        .flag-bullet {
          color: var(--bad, #EF4444);
          font-weight: bold;
        }

        .flag-text {
          color: var(--text-secondary, #334155);
          line-height: 1.4;
        }

        .empty-text {
          font-size: 13px;
          color: var(--text-muted, #94A3B8);
          margin: 0;
        }

        /* ── Notes ── */
        .notes-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notes-title {
          font-size: 1.25rem;
          margin: 0;
          color: var(--text-primary, #0F172A);
        }

        .notes-desc {
          font-size: 13px;
          color: var(--text-muted, #64748B);
          margin: 0;
        }

        .notes-textarea {
          width: 100%;
          background: var(--bg-subtle, #F1F5F9);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-md, 10px);
          padding: 12px;
          font-size: 13px;
          color: var(--text-primary, #0F172A);
          resize: vertical;
          outline: none;
        }

        .notes-textarea:focus {
          border-color: var(--recruiter-blue, #0284C7);
        }

        .btn-save-notes {
          align-self: flex-start;
          background: var(--recruiter-blue, #0284C7);
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm, 8px);
          font-size: 12px;
          cursor: pointer;
          margin-top: 4px;
        }

        @media (max-width: 600px) {
          .candidate-profile-row {
            flex-direction: column;
            text-align: center;
          }
          .title-row {
            justify-content: center;
          }
          .header-action-row {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
