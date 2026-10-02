'use client';

// ============================================================
// GITROAST — Candidate Duel & Talent Compare Client
// ============================================================
// WHAT: Side-by-side technical evaluation tool for technical recruiters
//       and engineering managers comparing two candidates concurrently.
//
// WHY:
//   Recruiters frequently debate between two shortlisted candidates for an engineering role.
//   Evaluating them side-by-side on hard GitHub metrics (commit hygiene, test presence,
//   abandoned repo ratio, and Gemini AI hireability briefs) eliminates guesswork.
//
// WHERE & WHEN TO USE:
//   Mounted at /recruiter/dashboard/compare.
//
// USE CASES:
//   1. Comparing two finalists for a Senior Frontend or Systems Engineer position.
//   2. Evaluating open-source contributions between two candidate resumes.
//   3. Benchmarking candidate work against known high-performing engineers.
//
// WHEN NOT TO USE:
//   Do not use for comedic developer battles (use /battle for social roasts).
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { analyzeCandidate, saveCandidate } from '@/services/recruiterService';
import { toast } from '@/utils/toast';
import { playClick, playSuccess } from '@/utils/soundFX';

const PRESET_DUELS = [
  { u1: 'shadcn', u2: 'leerob', label: 'UI vs Framework Titans' },
  { u1: 'gaearon', u2: 'yyx990803', label: 'React vs Vue Core' },
  { u1: 'antirez', u2: 'burntsushi', label: 'C Systems vs Rust' },
];

export default function CompareClient() {
  const [candidate1, setCandidate1] = useState('');
  const [candidate2, setCandidate2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [saving1, setSaving1] = useState(false);
  const [saving2, setSaving2] = useState(false);
  const [saved1, setSaved1] = useState(false);
  const [saved2, setSaved2] = useState(false);

  const cleanUsername = (str) =>
    (str || '')
      .trim()
      .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
      .replace(/^(?:www\.)?github\.com\//i, '')
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();

  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    playClick();

    const u1 = cleanUsername(candidate1);
    const u2 = cleanUsername(candidate2);

    if (!u1 || !u2) {
      toast.warning('Please enter both GitHub usernames to compare.');
      return;
    }

    if (u1 === u2) {
      toast.warning('Please enter two distinct candidates to compare.');
      return;
    }

    setLoading(true);
    setResult1(null);
    setResult2(null);
    setSaved1(false);
    setSaved2(false);

    try {
      const [res1, res2] = await Promise.all([
        analyzeCandidate(u1).catch((err) => ({ error: err.message || 'Failed' })),
        analyzeCandidate(u2).catch((err) => ({ error: err.message || 'Failed' })),
      ]);

      if (res1.error && res2.error) {
        toast.error('Failed to analyze both candidates. Please verify the usernames.');
      } else if (res1.error) {
        toast.warning(`Could not load candidate @${u1}: ${res1.error}`);
        setResult2(res2);
      } else if (res2.error) {
        toast.warning(`Could not load candidate @${u2}: ${res2.error}`);
        setResult1(res1);
      } else {
        setResult1(res1);
        setResult2(res2);
        playSuccess();
        toast.success(`Candidate duel generated: @${u1} vs @${u2}! ⚔️`);
      }
    } catch {
      toast.error('An unexpected error occurred during candidate analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCandidate = async (candidateNum, username) => {
    playClick();
    if (candidateNum === 1) setSaving1(true);
    else setSaving2(true);

    try {
      await saveCandidate(username, `Saved from Candidate Duel comparison`);
      playSuccess();
      if (candidateNum === 1) setSaved1(true);
      else setSaved2(true);
      toast.success(`@${username} saved to your recruiter vault! ⭐`);
    } catch (err) {
      toast.error(err.message || 'Failed to save candidate');
    } finally {
      if (candidateNum === 1) setSaving1(false);
      else setSaving2(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="compare-page">
      
      {/* ── Page Header ── */}
      <section className="compare-header">
        <div className="header-badge font-mono">⚔️ TALENT INTELLIGENCE DUEL</div>
        <h1 className="header-title font-display">CANDIDATE DUEL &amp; TECHNICAL COMPARE</h1>
        <p className="header-sub font-mono">
          Side-by-side engineering evaluation comparing commit hygiene, test presence, and repository maturity.
        </p>

        {/* ── Preset Benchmark Chips ── */}
        <div className="preset-row">
          <span className="preset-label font-mono">Quick Benchmarks:</span>
          {PRESET_DUELS.map((duel, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip font-mono"
              onClick={() => {
                setCandidate1(duel.u1);
                setCandidate2(duel.u2);
              }}
            >
              @{duel.u1} vs @{duel.u2}
            </button>
          ))}
        </div>
      </section>

      {/* ── Candidate Dual Inputs ── */}
      <form className="compare-input-card card" onSubmit={handleCompare}>
        <div className="inputs-grid">
          
          <div className="input-group">
            <label className="input-label font-mono">Candidate 1 GitHub Username</label>
            <div className="input-field-wrap">
              <span className="input-prefix font-mono">@</span>
              <input
                type="text"
                className="compare-input font-mono"
                placeholder="e.g. shadcn"
                value={candidate1}
                onChange={(e) => setCandidate1(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="vs-divider-box">
            <span className="vs-badge font-display">VS</span>
          </div>

          <div className="input-group">
            <label className="input-label font-mono">Candidate 2 GitHub Username</label>
            <div className="input-field-wrap">
              <span className="input-prefix font-mono">@</span>
              <input
                type="text"
                className="compare-input font-mono"
                placeholder="e.g. leerob"
                value={candidate2}
                onChange={(e) => setCandidate2(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

        </div>

        <button
          type="submit"
          className="btn btn-compare font-mono"
          disabled={loading || !candidate1.trim() || !candidate2.trim()}
        >
          {loading ? '⚡ Running Deep Candidate Analysis...' : '⚔️ Run Candidate Duel Analysis'}
        </button>
      </form>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="compare-loading-card card">
          <div className="loading-spinner">⚡</div>
          <h2 className="loading-title font-display">EVALUATING BOTH CODEBASES IN PARALLEL</h2>
          <p className="loading-desc font-mono">
            Extracting public commit frequencies, repository architectures, and test presence for @{cleanUsername(candidate1)} and @{cleanUsername(candidate2)}...
          </p>
        </div>
      )}

      {/* ── Comparison Results Arena ── */}
      {result1 && result2 && !loading && (
        <div className="compare-arena">
          
          {/* Summary Card */}
          <div className="arena-summary-card card font-mono">
            <div className="summary-header">
              <span className="summary-badge">📊 EXECUTIVE HIRING BRIEF</span>
              <span className="summary-matchup">@{result1.username} vs @{result2.username}</span>
            </div>
            <p className="summary-text">
              Direct technical audit based on public repositories and commit hygiene.
              Review individual strengths and architectural red flags below to inform hiring decisions.
            </p>
          </div>

          {/* Side-by-Side Dual Dossiers */}
          <div className="dossiers-grid">
            
            {/* Candidate 1 Dossier */}
            <div className="dossier-card card">
              <div className="dossier-header">
                <div className="dossier-avatar-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${result1.username}?s=120`}
                    alt={`@${result1.username}`}
                    className="dossier-avatar-img"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="dossier-meta">
                  <h3 className="dossier-name">@{result1.username}</h3>
                  <span className="dossier-role-chip font-mono">{result1.hireability?.roleRecommendation || 'Software Engineer'}</span>
                </div>
                <div
                  className="dossier-score-badge font-display"
                  style={{ color: getScoreColor(result1.score || 50), borderColor: getScoreColor(result1.score || 50) }}
                >
                  {result1.grade || 'B'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-box font-mono">
                <div className="metric-row">
                  <span className="metric-label">Technical Score</span>
                  <span className="metric-val" style={{ color: getScoreColor(result1.score || 50) }}>
                    {result1.score || 0}/100
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total Repositories</span>
                  <span className="metric-val">{result1.metrics?.totalRepos ?? result1.totalRepos ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Abandoned Repos</span>
                  <span className="metric-val text-bad">{result1.metrics?.abandonedRepos ?? result1.abandonedRepos ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total Stars Earned</span>
                  <span className="metric-val">{result1.metrics?.totalStars ?? result1.totalStars ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Primary Stack</span>
                  <span className="metric-val text-brand">{result1.topLanguage || 'Code'}</span>
                </div>
              </div>

              {/* Hireability Assessment */}
              <div className="brief-section font-mono">
                <h4 className="brief-title">💡 KEY STRENGTHS</h4>
                <ul className="brief-list">
                  {(result1.hireability?.strengths || ['Demonstrated open-source activity', 'Regular code commits']).map((s, i) => (
                    <li key={i} className="strength-item">✓ {s}</li>
                  ))}
                </ul>

                <h4 className="brief-title brief-title--warn">⚠️ RISK SIGNALS</h4>
                <ul className="brief-list">
                  {(result1.hireability?.redFlags || ['Unchecked repository sprawl', 'Limited unit tests found']).map((rf, i) => (
                    <li key={i} className="risk-item">✕ {rf}</li>
                  ))}
                </ul>
              </div>

              {/* Card Actions */}
              <div className="dossier-actions">
                <button
                  type="button"
                  className="btn btn-save-candidate font-mono"
                  onClick={() => handleSaveCandidate(1, result1.username)}
                  disabled={saving1 || saved1}
                >
                  {saved1 ? '⭐ Saved to Vault' : saving1 ? 'Saving...' : '⭐ Save Candidate'}
                </button>
                <Link
                  href={`/recruiter/dashboard/analyze/${result1.username}`}
                  className="btn btn-view-xray font-mono"
                >
                  Full X-Ray →
                </Link>
              </div>
            </div>

            {/* Candidate 2 Dossier */}
            <div className="dossier-card card">
              <div className="dossier-header">
                <div className="dossier-avatar-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${result2.username}?s=120`}
                    alt={`@${result2.username}`}
                    className="dossier-avatar-img"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="dossier-meta">
                  <h3 className="dossier-name">@{result2.username}</h3>
                  <span className="dossier-role-chip font-mono">{result2.hireability?.roleRecommendation || 'Software Engineer'}</span>
                </div>
                <div
                  className="dossier-score-badge font-display"
                  style={{ color: getScoreColor(result2.score || 50), borderColor: getScoreColor(result2.score || 50) }}
                >
                  {result2.grade || 'B'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-box font-mono">
                <div className="metric-row">
                  <span className="metric-label">Technical Score</span>
                  <span className="metric-val" style={{ color: getScoreColor(result2.score || 50) }}>
                    {result2.score || 0}/100
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total Repositories</span>
                  <span className="metric-val">{result2.metrics?.totalRepos ?? result2.totalRepos ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Abandoned Repos</span>
                  <span className="metric-val text-bad">{result2.metrics?.abandonedRepos ?? result2.abandonedRepos ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total Stars Earned</span>
                  <span className="metric-val">{result2.metrics?.totalStars ?? result2.totalStars ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Primary Stack</span>
                  <span className="metric-val text-brand">{result2.topLanguage || 'Code'}</span>
                </div>
              </div>

              {/* Hireability Assessment */}
              <div className="brief-section font-mono">
                <h4 className="brief-title">💡 KEY STRENGTHS</h4>
                <ul className="brief-list">
                  {(result2.hireability?.strengths || ['Demonstrated open-source activity', 'Regular code commits']).map((s, i) => (
                    <li key={i} className="strength-item">✓ {s}</li>
                  ))}
                </ul>

                <h4 className="brief-title brief-title--warn">⚠️ RISK SIGNALS</h4>
                <ul className="brief-list">
                  {(result2.hireability?.redFlags || ['Unchecked repository sprawl', 'Limited unit tests found']).map((rf, i) => (
                    <li key={i} className="risk-item">✕ {rf}</li>
                  ))}
                </ul>
              </div>

              {/* Card Actions */}
              <div className="dossier-actions">
                <button
                  type="button"
                  className="btn btn-save-candidate font-mono"
                  onClick={() => handleSaveCandidate(2, result2.username)}
                  disabled={saving2 || saved2}
                >
                  {saved2 ? '⭐ Saved to Vault' : saving2 ? 'Saving...' : '⭐ Save Candidate'}
                </button>
                <Link
                  href={`/recruiter/dashboard/analyze/${result2.username}`}
                  className="btn btn-view-xray font-mono"
                >
                  Full X-Ray →
                </Link>
              </div>
            </div>

          </div>

        </div>
      )}

      <style jsx>{`
        .compare-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 7.5rem; /* Strict clearance above fixed site footer */
          max-width: 1080px;
          margin: 0 auto;
          width: 100%;
        }

        .compare-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.6rem;
        }

        .header-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--recruiter-blue, #0284C7);
          background: #E0F2FE;
          padding: 3px 10px;
          border-radius: 9999px;
          letter-spacing: 0.5px;
        }

        .header-title {
          font-size: 2.25rem;
          color: var(--text-primary, #0F172A);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .header-sub {
          font-size: 13px;
          color: var(--text-secondary, #475569);
          max-width: 640px;
          line-height: 1.5;
          margin: 0;
        }

        .preset-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .preset-label {
          font-size: 11px;
          color: var(--text-muted, #64748B);
        }

        .preset-chip {
          font-size: 11px;
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          color: var(--text-secondary, #475569);
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .preset-chip:hover {
          border-color: var(--recruiter-blue, #0284C7);
          color: var(--recruiter-blue, #0284C7);
          background: #F0F9FF;
        }

        /* ── Input Card ── */
        .compare-input-card {
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .inputs-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary, #475569);
        }

        .input-field-wrap {
          display: flex;
          align-items: center;
          background: #F8FAFC;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 8px;
          padding: 0 12px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .input-field-wrap:focus-within {
          border-color: var(--recruiter-blue, #0284C7);
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
        }

        .input-prefix {
          font-size: 14px;
          color: var(--text-muted, #64748B);
          font-weight: 700;
        }

        .compare-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 10px 8px;
          font-size: 14px;
          color: var(--text-primary, #0F172A);
        }

        .vs-divider-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 1.25rem;
        }

        .vs-badge {
          font-size: 1.5rem;
          background: #111827;
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 8px;
          line-height: 1;
        }

        .btn-compare {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.25);
        }

        .btn-compare:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
        }

        .btn-compare:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Loading Card ── */
        .compare-loading-card {
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-spinner {
          font-size: 36px;
          animation: pulse 1.5s infinite;
        }

        .loading-title {
          font-size: 1.75rem;
          color: var(--recruiter-blue, #0284C7);
          margin: 0;
        }

        .loading-desc {
          font-size: 12px;
          color: var(--text-secondary, #475569);
          max-width: 480px;
          margin: 0;
        }

        /* ── Comparison Arena ── */
        .compare-arena {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .arena-summary-card {
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--recruiter-blue, #0284C7);
        }

        .summary-matchup {
          font-size: 11px;
          color: var(--text-muted, #64748B);
        }

        .summary-text {
          font-size: 12px;
          color: var(--text-secondary, #475569);
          margin: 0;
          line-height: 1.5;
        }

        .dossiers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .dossier-card {
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .dossier-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dossier-avatar-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid var(--recruiter-blue, #0284C7);
          overflow: hidden;
          flex-shrink: 0;
        }

        .dossier-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dossier-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dossier-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #0F172A);
          margin: 0;
        }

        .dossier-role-chip {
          font-size: 10px;
          background: #E0F2FE;
          color: #0284C7;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .dossier-score-badge {
          border: 2px solid;
          border-radius: 8px;
          font-size: 1.75rem;
          font-weight: 900;
          padding: 2px 10px;
          line-height: 1.1;
        }

        .metrics-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #E2E8F0;
          color: var(--text-secondary, #475569);
        }

        .metric-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .metric-val {
          font-weight: 700;
          color: var(--text-primary, #0F172A);
        }

        .text-bad {
          color: #EF4444;
        }

        .text-brand {
          color: #0284C7;
        }

        .brief-section {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .brief-title {
          font-size: 11px;
          font-weight: 700;
          color: #10B981;
          margin: 0;
        }

        .brief-title--warn {
          color: #EF4444;
          margin-top: 0.4rem;
        }

        .brief-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .strength-item {
          font-size: 11px;
          color: #0F172A;
          line-height: 1.4;
        }

        .risk-item {
          font-size: 11px;
          color: #991B1B;
          line-height: 1.4;
        }

        .dossier-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .btn-save-candidate {
          flex: 1;
          padding: 10px;
          border: 1px solid var(--recruiter-blue, #0284C7);
          background: #F0F9FF;
          color: #0284C7;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-save-candidate:hover:not(:disabled) {
          background: #E0F2FE;
        }

        .btn-view-xray {
          padding: 10px 14px;
          background: #111827;
          color: #FFFFFF;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }

        .btn-view-xray:hover {
          background: #1F2937;
        }

        @media (max-width: 768px) {
          .inputs-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .vs-divider-box {
            padding-top: 0;
          }
          .dossiers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

    </div>
  );
}
