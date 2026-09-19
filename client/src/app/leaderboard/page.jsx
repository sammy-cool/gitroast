"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeaderboardTable from "@/components/LeaderboardTable";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

function LeaderboardSkeleton() {
  return (
    <div className="lb-skeleton">
      <div className="skel-header-row">
        <div className="skel skel-col-rank" />
        <div className="skel skel-col-user" />
        <div className="skel skel-col-score" />
        <div className="skel skel-col-count" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="skel-row">
          <div className="skel skel-rank" />
          <div className="skel-user-col">
            <div className="skel skel-avatar" />
            <div className="skel skel-username" />
          </div>
          <div className="skel skel-score" />
          <div className="skel skel-count" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPage = parseInt(searchParams.get("page"), 10) || 1;
  const currentPage = Math.max(1, rawPage);

  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async (targetPage) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `${API_BASE}/api/history/leaderboard/worst?page=${targetPage}&limit=10`
      );
      if (!res.ok) throw new Error("Could not fetch leaderboard");
      const data = await res.json();
      setEntries(data.leaderboard || []);
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({
          page: targetPage,
          limit: 10,
          total: data.leaderboard?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch {
      setEntries([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(currentPage);
  }, [currentPage, fetchLeaderboard]);

  const handlePageChange = (newPage) => {
    if (
      newPage === currentPage ||
      newPage < 1 ||
      (pagination.totalPages && newPage > pagination.totalPages)
    ) {
      return;
    }
    router.push(`/leaderboard?page=${newPage}`, { scroll: false });
    const cardEl = document.querySelector(".lb-card");
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const pageNumbers = getPageNumbers(
    pagination.page || currentPage,
    pagination.totalPages || 1
  );

  const fromIndex =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;
  const toIndex = Math.min(
    pagination.total,
    pagination.page * pagination.limit
  );

  return (
    <main className="lb-page">
      {/* ── Nav ── */}
      <div className="lb-nav">
        <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
        <button className="btn btn-ghost" onClick={() => router.push("/")}>
          ← Home
        </button>
      </div>

      {/* ── Header ── */}
      <div className="lb-title-block">
        <h1 className="font-display lb-title text-fire">🏆 Wall of Shame</h1>
        <p className="font-mono lb-sub">
          The most brutally roasted GitHub profiles. Globally.
        </p>
      </div>

      {/* ── Table Card ── */}
      <div className="card lb-card">
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="lb-error">
            <p
              className="font-mono"
              style={{ color: "var(--bad)", marginBottom: "1rem" }}
            >
              ❌ Could not load leaderboard. Check your connection.
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => fetchLeaderboard(currentPage)}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <LeaderboardTable
              entries={entries}
              page={pagination.page}
              limit={pagination.limit}
            />

            {/* ── Pagination Bar ── */}
            {pagination.total > 0 && (
              <div className="lb-pagination">
                <div className="lb-page-info font-mono">
                  Showing{" "}
                  <span className="info-highlight text-fire">
                    {fromIndex}–{toIndex}
                  </span>{" "}
                  of{" "}
                  <span className="info-highlight text-fire">
                    {pagination.total}
                  </span>{" "}
                  shameful profiles
                </div>

                {pagination.totalPages > 1 && (
                  <div className="lb-page-controls">
                    <button
                      className="btn btn-ghost lb-nav-btn font-mono"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Previous Page"
                    >
                      ← Prev
                    </button>

                    <div className="lb-page-numbers">
                      {pageNumbers.map((p, idx) =>
                        p === "..." ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="lb-ellipsis font-mono"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            className={`lb-page-btn font-display ${
                              p === currentPage ? "active" : ""
                            }`}
                            onClick={() => handlePageChange(p)}
                            disabled={loading}
                            aria-current={p === currentPage ? "page" : undefined}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      className="btn btn-ghost lb-nav-btn font-mono"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Next Page"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA ── */}
      <button
        className="btn btn-primary lb-cta"
        onClick={() => router.push("/")}
      >
        🔥 Add Yourself to the List
      </button>

      <style jsx>{`
        .lb-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 3rem;
          gap: 1.25rem;
          max-width: 640px;
          margin: 0 auto;
        }

        /* Nav */
        .lb-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .nav-logo {
          font-size: 22px;
        }

        /* Header */
        .lb-title-block {
          text-align: center;
        }
        .lb-title {
          font-size: clamp(36px, 10vw, 56px);
          line-height: 1;
        }
        .lb-sub {
          color: var(--text-secondary);
          font-size: 13px;
          margin-top: 8px;
        }

        /* Card */
        .lb-card {
          width: 100%;
          overflow: hidden;
        }

        /* ── Pagination ── */
        .lb-pagination {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          padding: 1.1rem 1.25rem;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
        }

        .lb-page-info {
          font-size: 11px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .info-highlight {
          font-weight: 700;
        }

        .lb-page-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .lb-nav-btn {
          height: 32px;
          padding: 4px 12px;
          font-size: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .lb-nav-btn:hover:not(:disabled) {
          border-color: #ff6b00;
          color: var(--text-primary);
        }
        .lb-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .lb-page-numbers {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .lb-page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lb-page-btn:hover:not(.active) {
          border-color: #ff6b00;
          color: var(--text-primary);
        }
        .lb-page-btn.active {
          background: linear-gradient(135deg, #ff4500 0%, #ff6b00 50%, #ffb700 100%);
          color: #070707;
          font-weight: 700;
          border: none;
          box-shadow: 0 0 12px rgba(255, 69, 0, 0.35);
        }

        .lb-ellipsis {
          color: var(--text-muted);
          font-size: 14px;
          padding: 0 4px;
        }

        /* ── Skeleton ── */
        .lb-skeleton {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .skel-header-row {
          display: grid;
          grid-template-columns: 48px 1fr 100px 72px;
          gap: 1rem;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
        }
        .skel-row {
          display: grid;
          grid-template-columns: 48px 1fr 100px 72px;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
        }
        .skel-row:last-child {
          border-bottom: none;
        }

        .skel-user-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .skel {
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 25%,
            var(--border-hover, #2e2e2e) 50%,
            var(--bg-elevated) 75%
          );
          background-size: 200% 100%;
          animation: skelShimmer 1.5s ease-in-out infinite;
          border-radius: var(--radius-sm);
        }

        .skel-col-rank {
          height: 10px;
          width: 20px;
        }
        .skel-col-user {
          height: 10px;
          width: 80px;
        }
        .skel-col-score {
          height: 10px;
          width: 40px;
        }
        .skel-col-count {
          height: 10px;
          width: 30px;
        }
        .skel-rank {
          height: 20px;
          width: 28px;
        }
        .skel-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 50%;
        }
        .skel-username {
          height: 12px;
          width: 120px;
        }
        .skel-score {
          height: 28px;
          width: 52px;
          border-radius: var(--radius-md);
        }
        .skel-count {
          height: 12px;
          width: 28px;
        }

        @keyframes skelShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Error state */
        .lb-error {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* CTA */
        .lb-cta {
          padding: 13px 28px;
          font-size: 15px;
        }

        @media (max-width: 480px) {
          .lb-page-controls {
            gap: 0.35rem;
          }
          .lb-nav-btn {
            padding: 4px 8px;
            font-size: 11px;
          }
          .lb-page-btn {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<main className="lb-page"><LeaderboardSkeleton /></main>}>
      <LeaderboardContent />
    </Suspense>
  );
}
