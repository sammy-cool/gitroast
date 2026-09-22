'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createToast } from 'customizable-toast-notification';
import LeaderboardTable from '@/components/LeaderboardTable';
import CompanyLeaderboardTable from '@/components/CompanyLeaderboardTable';
import Pagination from '@/components/Pagination';
import Breadcrumb from '@/components/Breadcrumb';
import { getLeaderboard, getCompanyLeaderboard, searchLeaderboard } from '@/services/roastService';

export function LeaderboardSkeleton() {
  return (
    <div className="lb-skeleton" aria-label="Loading leaderboard">
      <div className="skel-header-row">
        <div className="skel skel-col-rank" />
        <div className="skel skel-col-user" />
        <div className="skel skel-col-score" />
        <div className="skel skel-col-count" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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

      <style jsx>{`
        .lb-skeleton {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .skel-header-row {
          display: grid;
          grid-template-columns: 56px 1fr 88px 68px;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
          align-items: center;
        }

        .skel-row {
          display: grid;
          grid-template-columns: 56px 1fr 88px 68px;
          gap: 0.75rem;
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
          width: 24px;
          margin: 0 auto;
        }
        .skel-col-user {
          height: 10px;
          width: 70px;
        }
        .skel-col-score {
          height: 10px;
          width: 40px;
          margin: 0 auto;
        }
        .skel-col-count {
          height: 10px;
          width: 36px;
          margin-left: auto;
        }

        .skel-rank {
          height: 18px;
          width: 26px;
          margin: 0 auto;
        }
        .skel-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .skel-username {
          height: 12px;
          width: 120px;
        }
        .skel-score {
          height: 24px;
          width: 46px;
          margin: 0 auto;
          border-radius: var(--radius-sm);
        }
        .skel-count {
          height: 12px;
          width: 24px;
          margin-left: auto;
        }

        @keyframes skelShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 520px) {
          .skel-header-row,
          .skel-row {
            grid-template-columns: 42px 1fr 64px 50px;
            gap: 0.5rem;
            padding: 0.75rem 0.85rem;
          }

          .skel-avatar {
            width: 24px;
            height: 24px;
          }
          .skel-username {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}

export default function LeaderboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPage = parseInt(searchParams.get('page'), 10) || 1;
  const currentPage = Math.max(1, rawPage);

  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('developers');
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const debounceRef = useRef(null);

  const fetchPage = useCallback(async (targetPage) => {
    // Only show full skeleton on initial mount; use smooth state for subsequent pages
    if (!hasLoadedRef.current) {
      setInitialLoading(true);
    } else {
      setPageLoading(true);
    }
    setError(false);

    try {
      const data = await getLeaderboard(targetPage, 10);
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
      createToast({
        type: 'error',
        message: 'Could not load leaderboard. The server may be warming up. Please try again.',
        position: 'top-center',
        duration: 4000,
      });
    } finally {
      hasLoadedRef.current = true;
      setInitialLoading(false);
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  const handlePageChange = (newPage) => {
    if (
      newPage === currentPage ||
      newPage < 1 ||
      (pagination.totalPages && newPage > pagination.totalPages)
    ) {
      return;
    }
    router.push(`/leaderboard?page=${newPage}`, { scroll: false });
    const cardEl = document.querySelector('.lb-card');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // WHY debounce: prevents firing a search API call on every keystroke
  //     350ms delay waits for the user to pause typing before querying
  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchLeaderboard(value.trim());
        setSearchResults(data.results || []);
      } catch {
        createToast({ type: 'error', message: 'Search failed. Please try again.', position: 'top-center' });
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  useEffect(() => {
    if (tab === 'companies' && companies.length === 0) {
      setCompaniesLoading(true);
      getCompanyLeaderboard()
        .then((data) => setCompanies(data))
        .catch(() => {
          createToast({
            type: 'error',
            message: 'Could not load tech giants leaderboard.',
            position: 'top-center',
          });
        })
        .finally(() => setCompaniesLoading(false));
    }
  }, [tab, companies.length]);

  // WHY cleanup: cancel any pending debounce timer on component unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <main className="lb-page">
      {/* ── Top Navigation ── */}
      <nav className="lb-nav" aria-label="Breadcrumb navigation">
        <Link href="/" className="font-display nav-logo text-fire" title="GitRoast Home">
          GITROAST 🔥
        </Link>
        <Link href="/" className="btn btn-ghost nav-back">
          ← Home
        </Link>
      </nav>

      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-wrap">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wall of Shame' }]} />
      </div>

      {/* ── Page Header ── */}
      <header className="lb-title-block">
        <h1 className="font-display lb-title text-fire">🏆 Wall of Shame</h1>
        <p className="font-mono lb-sub">
          {tab === 'developers'
            ? 'The most brutally roasted GitHub profiles. Globally.'
            : 'Who has the messiest commit habits among tech giants? Ranked.'}
        </p>

        {/* ── Tabs ── */}
        <div className="lb-tabs font-mono">
          <button
            type="button"
            className={`lb-tab-btn ${tab === 'developers' ? 'lb-tab-btn--active' : ''}`}
            onClick={() => setTab('developers')}
          >
            👤 Developers
          </button>
          <button
            type="button"
            className={`lb-tab-btn ${tab === 'companies' ? 'lb-tab-btn--active' : ''}`}
            onClick={() => setTab('companies')}
          >
            🏢 Tech Giants
          </button>
        </div>
      </header>

      {tab === 'developers' && (
        <div className="lb-search-wrap">
          <div className="lb-search-bar">
            <span className="lb-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="lb-search-input font-mono"
              placeholder="Search developers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search the Wall of Shame"
              maxLength={39}
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                type="button"
                className="lb-search-clear"
                onClick={() => { handleSearch(''); }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchLoading && (
            <div className="lb-search-status font-mono">Searching...</div>
          )}
          {searchResults !== null && !searchLoading && (
            <div className="lb-search-status font-mono">
              {searchResults.length > 0 ? `${searchResults.length} developer${searchResults.length !== 1 ? 's' : ''} found` : `No developers found for "${searchQuery}"`}
            </div>
          )}
        </div>
      )}

      {/* ── Main Leaderboard Card ── */}
      <section className="card lb-card" aria-label="Leaderboard rankings">
        {/* Subtle progress bar during page transitions to prevent layout shifts */}
        {pageLoading && <div className="lb-progress-bar" aria-hidden="true" />}

        {tab === 'companies' ? (
          companiesLoading ? (
            <LeaderboardSkeleton />
          ) : (
            <CompanyLeaderboardTable companies={companies} />
          )
        ) : initialLoading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="lb-error">
            <p className="font-mono error-msg">
              ❌ Could not load leaderboard. The server may be warming up.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fetchPage(currentPage)}
            >
              Try Again ↻
            </button>
          </div>
        ) : searchResults !== null ? (
          <div className="lb-content">
            <LeaderboardTable
              entries={searchResults}
              page={1}
              limit={searchResults.length || 10}
              emptyMessage={searchQuery ? `No developers found matching "${searchQuery}".` : 'No developers found.'}
            />
          </div>
        ) : (
          <div className={`lb-content ${pageLoading ? 'lb-content--transitioning' : ''}`}>
            <LeaderboardTable
              entries={entries}
              page={pagination.page}
              limit={pagination.limit}
            />

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              onPageChange={handlePageChange}
              loading={pageLoading}
            />
          </div>
        )}
      </section>

      {/* ── Bottom CTA ── */}
      <Link href="/" className="btn btn-primary lb-cta">
        🔥 Add Yourself to the List
      </Link>

      <style jsx>{`
        .lb-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 6.5rem;
          gap: 1.5rem;
          max-width: 640px;
          margin: 0 auto;
          width: 100%;
        }

        /* Nav */
        .lb-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .breadcrumb-wrap {
          width: 100%;
          margin-top: -0.5rem;
        }
        .lb-nav :global(.nav-logo),
        .nav-logo {
          font-size: 22px;
          text-decoration: none;
          letter-spacing: 0.5px;
        }
        .lb-nav :global(.nav-back),
        .nav-back {
          font-size: 13px;
        }

        /* Header */
        .lb-title-block {
          text-align: center;
        }
        .lb-title {
          font-size: clamp(36px, 9vw, 56px);
          line-height: 1.05;
          margin-bottom: 6px;
        }
        .lb-sub {
          color: var(--text-secondary);
          font-size: 13px;
          letter-spacing: 0.2px;
          margin-bottom: 1rem;
        }
        .lb-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .lb-tab-btn {
          padding: 6px 14px;
          font-size: 12px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lb-tab-btn:hover {
          color: var(--text-primary);
        }
        .lb-tab-btn--active {
          background: var(--fire-grad);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(255, 69, 0, 0.25);
        }

        /* Card */
        .lb-card {
          width: 100%;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .lb-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #ff4500, #ffb700, #ff4500);
          background-size: 200% 100%;
          animation: progressAnimation 1s linear infinite;
          z-index: 10;
        }

        @keyframes progressAnimation {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .lb-content {
          transition: opacity 0.2s ease;
        }
        .lb-content--transitioning {
          opacity: 0.65;
          pointer-events: none;
        }

        /* Error state */
        .lb-error {
          padding: 3.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.25rem;
        }
        .error-msg {
          color: var(--bad);
          font-size: 14px;
        }

        /* CTA */
        .lb-page :global(.lb-cta),
        .lb-cta {
          padding: 13px 28px;
          font-size: 15px;
          text-decoration: none;
          border-radius: var(--radius-md);
        }

        /* ── Search ── */
        .lb-search-wrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lb-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .lb-search-bar:focus-within {
          border-color: var(--fire);
          box-shadow: 0 0 0 2px rgba(255, 69, 0, 0.15);
        }
        .lb-search-icon {
          font-size: 14px;
          flex-shrink: 0;
          opacity: 0.6;
        }
        .lb-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 13px;
          letter-spacing: 0.3px;
          min-width: 0;
        }
        .lb-search-input::placeholder {
          color: var(--text-muted);
        }
        .lb-search-clear {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.15s ease, background 0.15s ease;
          line-height: 1;
        }
        .lb-search-clear:hover {
          color: var(--fire);
          background: rgba(255, 69, 0, 0.08);
        }
        .lb-search-status {
          font-size: 11px;
          color: var(--text-secondary);
          text-align: center;
          letter-spacing: 0.3px;
        }

        @media (max-width: 520px) {
          .lb-page {
            padding: 1.25rem 0.75rem 6rem;
            gap: 1.25rem;
          }

          .lb-search-bar {
            padding: 8px 12px;
          }
          .lb-search-input {
            font-size: 12px;
          }

          .lb-nav :global(.nav-logo),
          .nav-logo {
            font-size: 20px;
          }

          .lb-title {
            font-size: clamp(32px, 8.5vw, 42px);
          }

          .lb-sub {
            font-size: 12px;
          }

          .lb-page :global(.lb-cta),
          .lb-cta {
            width: 100%;
            padding: 14px 20px;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
