'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedCandidates, removeCandidate } from '@/services/recruiterService';
import { toast } from '@/utils/toast';
import { playClick } from '@/utils/soundFX';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Recruiter Candidate Bookmarking Vault (`SavedClient`).
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Displays shortlisted candidates and private recruiter notes with direct
 * links to candidate briefs, head-to-head comparisons, and public roast reports.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Mounted at /recruiter/dashboard/saved.
 */
export default function SavedClient() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      const data = await getSavedCandidates();
      setCandidates(data.candidates || []);
    } catch (err) {
      toast.apiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRemove = async (username) => {
    playClick();
    try {
      await removeCandidate(username);
      toast.info(`@${username} removed from saved candidate vault.`);
      setCandidates((prev) => prev.filter((c) => c.username !== username));
    } catch (err) {
      toast.apiError(err, { username });
    }
  };

  return (
    <div className="saved-page">
      <header className="saved-header">
        <h1 className="saved-title font-display">BOOKMARKED CANDIDATES</h1>
        <p className="saved-desc">
          Manage your shortlist of evaluated developer candidates and private interview notes.
        </p>
      </header>

      {loading ? (
        <div className="saved-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card candidate-card-skeleton animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-icon font-display">📁</div>
          <h2 className="empty-title font-display">NO CANDIDATES SAVED YET</h2>
          <p className="empty-desc">
            Use Candidate Search to analyze developers by their GitHub activity, test suites, and commit discipline.
          </p>
          <Link href="/recruiter/dashboard" className="btn btn-search font-mono">
            Search Candidates ⚡
          </Link>
        </div>
      ) : (
        <div className="saved-grid">
          {candidates.map((c) => (
            <div key={c.username} className="card candidate-card">
              <div className="card-top">
                <div className="candidate-avatar-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${c.username}?s=100`}
                    alt={c.username}
                    className="candidate-avatar-img"
                    crossOrigin="anonymous"
                    loading="lazy"
                  />
                </div>
                <div className="card-info">
                  <h3 className="candidate-handle font-display">@{c.username}</h3>
                  <span className="saved-date font-mono">
                    Saved {new Date(c.savedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {c.notes && (
                <div className="candidate-notes font-mono">
                  &ldquo;{c.notes}&rdquo;
                </div>
              )}

              <div className="card-actions">
                <Link
                  href={`/recruiter/dashboard/analyze/${c.username}`}
                  className="btn btn-brief font-mono"
                >
                  Candidate X-Ray →
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(c.username)}
                  className="btn btn-remove font-mono"
                  title="Remove from saved"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .saved-page {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .saved-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .saved-title {
          font-size: 2.25rem;
          color: var(--text-primary, #0F172A);
          letter-spacing: 0.5px;
          margin: 0;
        }

        .saved-desc {
          font-size: 14px;
          color: var(--text-secondary, #475569);
          margin: 0;
        }

        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .candidate-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.05));
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .candidate-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          border-color: var(--recruiter-border, #BAE6FD);
        }

        .candidate-card-skeleton {
          height: 180px;
          background: var(--bg-subtle, #F1F5F9);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .candidate-avatar-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--recruiter-border, #BAE6FD);
          flex-shrink: 0;
        }

        .candidate-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-info {
          display: flex;
          flex-direction: column;
        }

        .candidate-handle {
          font-size: 1.35rem;
          color: var(--text-primary, #0F172A);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .saved-date {
          font-size: 11px;
          color: var(--text-muted, #94A3B8);
        }

        .candidate-notes {
          font-size: 12px;
          color: var(--text-secondary, #475569);
          background: var(--bg-subtle, #F1F5F9);
          border-radius: var(--radius-sm, 8px);
          padding: 8px 12px;
          line-height: 1.4;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border, #E2E8F0);
        }

        .btn-brief {
          flex: 1;
          background: var(--recruiter-subtle, #F0F9FF);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          color: var(--recruiter-blue, #0284C7);
          padding: 8px 14px;
          border-radius: var(--radius-md, 10px);
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          transition: background 0.15s;
        }

        .btn-brief:hover {
          background: #E0F2FE;
        }

        .btn-remove {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted, #94A3B8);
          font-size: 11px;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: var(--radius-sm, 8px);
        }

        .btn-remove:hover {
          color: var(--bad, #EF4444);
          background: rgba(239, 68, 68, 0.06);
        }

        /* ── Empty Card ── */
        .empty-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 3.5rem 2rem;
          text-align: center;
          max-width: 500px;
          margin: 2rem auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.05));
        }

        .empty-icon {
          font-size: 40px;
        }

        .empty-title {
          font-size: 1.5rem;
          color: var(--text-primary, #0F172A);
          margin: 0;
        }

        .empty-desc {
          font-size: 13px;
          color: var(--text-secondary, #475569);
          margin: 0;
          line-height: 1.5;
        }

        .btn-search {
          background: var(--recruiter-grad, linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%));
          color: #FFFFFF;
          padding: 10px 20px;
          border-radius: var(--radius-md, 10px);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
