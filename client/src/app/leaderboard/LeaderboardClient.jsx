'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/utils/toast';
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
      toast.error('Could not load leaderboard. The server may be warming up. Please try again.', {
        cta: {
          label: 'Retry 🔄',
          onClick: () => fetchPage(targetPage),
          autoClose: true,
        },
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
        toast.error('Search failed. Please try again.');
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
          toast.error('Could not load tech giants leaderboard.');
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
      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-wrap">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wall of Shame' }]} />
      </div>

      {/* ── Top Obsidian Editorial Banner (Figma Master Alignment) ── */}
      <section className="lb-obsidian-banner">
        <div className="lb-banner-content">
          <div className="lb-banner-text">
            <span className="lb-eyebrow font-mono">WALL OF SHAME / PUBLIC OPT-IN PROFILES</span>
            <h1 className="lb-title font-serif">
              Public evidence. Friendly rivalry. Zero dunking down.
            </h1>
            <p className="lb-sub font-sans">
              Discover developers and companies by visible craft signals, then settle the important question: whose Git history has better lore?
            </p>
          </div>

          <div className="lb-banner-stats">
            <div className="banner-stat-block">
              <span className="stat-label font-mono">OPT-IN PROFILES</span>
              <span className="stat-number font-serif">48.2k</span>
              <span className="stat-sub font-mono">Visible this season</span>
            </div>
            <div className="banner-stat-block banner-stat-block--fire">
              <span className="stat-label font-mono">BATTLES TODAY</span>
              <span className="stat-number font-serif text-fire">1,284</span>
              <span className="stat-sub font-mono">96% rematch rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Controls & Filter Bar ── */}
      <div className="lb-controls-bar">
        <div className="lb-tabs-group font-mono">
          <button
            type="button"
            className={`lb-tab-btn ${tab === 'developers' ? 'lb-tab-btn--active' : ''}`}
            onClick={() => setTab('developers')}
          >
            Developers
          </button>
          <button
            type="button"
            className={`lb-tab-btn ${tab === 'companies' ? 'lb-tab-btn--active' : ''}`}
            onClick={() => setTab('companies')}
          >
            Companies
          </button>
          <Link href="/battle" className="lb-tab-btn lb-tab-link">
            Battles
          </Link>
        </div>

        <div className="lb-search-container">
          <span className="lb-search-icon">🔍</span>
          <input
            type="text"
            className="lb-search-input font-mono"
            placeholder="Search handle, company or repository"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            maxLength={39}
          />
          {searchQuery && (
            <button
              type="button"
              className="lb-search-clear"
              onClick={() => handleSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="lb-filter-pills font-mono">
          <span className="filter-pill">Window: 12 weeks ▾</span>
          <span className="filter-pill">Language: Any ▾</span>
        </div>

        <Link href="/battle" className="btn-set-rivalry font-mono">
          ⚔️ Set up a rivalry
        </Link>
      </div>

      {searchLoading && (
        <div className="lb-search-status font-mono">Searching the evidence board...</div>
      )}

      {/* ── Two-Column Layout (Figma Top Right Alignment) ── */}
      <div className="lb-layout-grid">
        <div className="lb-main-col">
          <div className="evidence-board-header">
            <div>
              <span className="season-tag font-mono">SEASON 08</span>
              <h2 className="evidence-title font-serif">The evidence board</h2>
              <p className="evidence-sub font-sans">
                Ranking favors balanced, recent public evidence—not raw activity volume.
              </p>
            </div>
            <span className="update-status font-mono">UPDATED 4 MIN AGO</span>
          </div>

          {/* ── Main Leaderboard Card ── */}
          <section className="lb-card" aria-label="Leaderboard rankings">
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
          <Link href="/" className="btn btn-primary lb-cta font-mono">
            🔥 Add Yourself to the List
          </Link>
        </div>

        {/* ── Right Column: Rivalry Setup + Company Spotlight + Inclusive by Design ── */}
        <aside className="lb-side-col">
          {/* Rivalry Setup Card */}
          <div className="rivalry-card">
            <span className="rivalry-eyebrow font-mono">RIVALRY SETUP</span>
            <h3 className="rivalry-title font-serif">
              Two profiles enter. The evidence decides.
            </h3>
            <div className="rivalry-vs-box">
              <div className="rivalry-slot font-mono">
                <span className="rivalry-avatar">OL</span>
                <span>octavia-labs</span>
              </div>
              <span className="rivalry-vs-tag font-mono">VS</span>
              <div className="rivalry-slot rivalry-slot--empty font-mono">
                <span>+ Choose rival</span>
              </div>
            </div>
            <div className="rivalry-pills font-mono">
              <span className="rivalry-pill rivalry-pill--active">Balanced</span>
              <span className="rivalry-pill">Docs</span>
              <span className="rivalry-pill">Depth</span>
            </div>
            <Link href="/battle" className="btn-preview-battle font-mono">
              ⚔️ Preview battle
            </Link>
            <p className="rivalry-microcopy font-sans">
              Only opt-in profiles can appear publicly. Private results stay private.
            </p>
          </div>

          {/* Company Spotlight Card */}
          <div className="company-spotlight-card">
            <span className="spotlight-eyebrow font-mono">COMPANY SPOTLIGHT</span>
            <h3 className="spotlight-title font-sans">Ember Systems</h3>
            <p className="spotlight-desc font-sans">
              Balanced score 87 • 42 public contributors • strongest signal: documentation health.
            </p>
            <div className="spotlight-chips font-mono">
              <span className="spotlight-chip">TypeScript</span>
              <span className="spotlight-chip">Remote</span>
              <span className="spotlight-chip">Evidence 90d</span>
            </div>
            <button
              type="button"
              className="btn-company-profile font-mono"
              onClick={() => setTab('companies')}
            >
              View company profile
            </button>
          </div>

          {/* Inclusive by Design Card */}
          <div className="inclusive-card">
            <span className="inclusive-icon">🛡️</span>
            <h3 className="inclusive-title font-sans">Inclusive by design</h3>
            <p className="inclusive-desc font-sans">
              Rankings exclude identity, geography, follower count and private activity. Visibility is opt-in and reversible.
            </p>
            <Link href="/about" className="inclusive-link font-sans">
              Read ranking safeguards →
            </Link>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .lb-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.25rem 7.5rem;
          gap: 1.75rem;
          max-width: 1240px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Obsidian Top Banner ── */
        .lb-obsidian-banner {
          width: 100%;
          background: #171717;
          border: 1px solid #262626;
          border-radius: 18px;
          color: #FFFFFF;
          padding: 2.5rem 3rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        .lb-banner-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3rem;
          flex-wrap: wrap;
        }
        .lb-banner-text {
          flex: 1;
          min-width: 320px;
        }
        .lb-eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
          display: block;
          margin-bottom: 0.6rem;
        }
        .lb-title {
          font-size: clamp(32px, 4.5vw, 52px);
          line-height: 1.08;
          color: #FFFFFF;
          margin: 0 0 0.75rem;
          font-weight: 400;
        }
        .lb-sub {
          font-size: 14px;
          color: #9CA3AF;
          line-height: 1.6;
          margin: 0;
          max-width: 620px;
        }
        .lb-banner-stats {
          display: flex;
          gap: 2.5rem;
          flex-shrink: 0;
        }
        .banner-stat-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .stat-label {
          font-size: 10px;
          letter-spacing: 1px;
          color: #9CA3AF;
        }
        .stat-number {
          font-size: 42px;
          line-height: 1;
          color: #FFFFFF;
          font-weight: 400;
        }
        .stat-sub {
          font-size: 11px;
          color: #6B7280;
        }

        /* ── Controls Bar ── */
        .lb-controls-bar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .lb-tabs-group {
          display: inline-flex;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }
        .lb-tab-btn {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          background: transparent;
          border: none;
          color: #4B5563;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lb-tab-btn--active {
          background: #171717;
          color: #FFFFFF;
        }
        :global(.lb-tab-link) {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .lb-search-container {
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 10px;
          padding: 8px 14px;
        }
        .lb-search-icon {
          font-size: 14px;
          color: #9CA3AF;
        }
        .lb-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 12px;
          color: #171717;
        }
        .lb-search-clear {
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
        }

        .lb-filter-pills {
          display: flex;
          gap: 8px;
        }
        .filter-pill {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          color: #4B5563;
          cursor: pointer;
        }

        :global(.btn-set-rivalry) {
          background: #EA580C;
          color: #FFFFFF !important;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }
        :global(.btn-set-rivalry:hover) {
          background: #C2410C;
        }

        .evidence-board-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .season-tag {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
        }
        .evidence-title {
          font-size: 32px;
          line-height: 1.1;
          color: #171717;
          margin: 4px 0 6px;
          font-weight: 400;
        }
        .evidence-sub {
          font-size: 13px;
          color: #6B7280;
          margin: 0;
        }
        .update-status {
          font-size: 10px;
          letter-spacing: 1px;
          color: #9CA3AF;
        }

        /* ── Sidebar Styles ── */
        .rivalry-card {
          background: #171717;
          border: 1px solid #262626;
          border-radius: 14px;
          padding: 1.5rem 1.75rem;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .rivalry-eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
        }
        .rivalry-title {
          font-size: 24px;
          color: #FFFFFF;
          margin: 0;
          font-weight: 400;
          line-height: 1.2;
        }
        .rivalry-vs-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rivalry-slot {
          flex: 1;
          background: #262626;
          border: 1px solid #383838;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #E5E7EB;
        }
        .rivalry-slot--empty {
          border-style: dashed;
          color: #9CA3AF;
          justify-content: center;
        }
        .rivalry-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #EA580C;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
        }
        .rivalry-vs-tag {
          font-size: 11px;
          color: #F59E0B;
          font-weight: 700;
        }
        .rivalry-pills {
          display: flex;
          gap: 6px;
        }
        .rivalry-pill {
          padding: 4px 10px;
          border-radius: 9999px;
          background: #262626;
          font-size: 11px;
          color: #9CA3AF;
          cursor: pointer;
        }
        .rivalry-pill--active {
          background: #FFFFFF;
          color: #171717;
          font-weight: 600;
        }
        :global(.btn-preview-battle) {
          background: #EA580C;
          color: #FFFFFF !important;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        :global(.btn-preview-battle:hover) {
          background: #C2410C;
        }
        .rivalry-microcopy {
          font-size: 10px;
          color: #9CA3AF;
          line-height: 1.4;
          margin: 0;
        }

        /* Company Spotlight Card */
        .company-spotlight-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 14px;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .spotlight-eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #EA580C;
          font-weight: 700;
        }
        .spotlight-title {
          font-size: 18px;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .spotlight-desc {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
        }
        .spotlight-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .spotlight-chip {
          padding: 4px 8px;
          background: #F3F4F6;
          border-radius: 6px;
          font-size: 10px;
          color: #4B5563;
        }
        .btn-company-profile {
          background: transparent;
          border: 1px solid #CBD5E1;
          color: #171717;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
          transition: all 0.15s ease;
        }
        .btn-company-profile:hover {
          border-color: #EA580C;
          color: #EA580C;
        }

        /* Inclusive Card */
        .inclusive-card {
          background: #E0F2FE;
          border: 1px solid #BAE6FD;
          border-radius: 14px;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .inclusive-icon {
          font-size: 18px;
        }
        .inclusive-title {
          font-size: 15px;
          font-weight: 700;
          color: #0369A1;
          margin: 0;
        }
        .inclusive-desc {
          font-size: 12px;
          color: #0C4A6E;
          line-height: 1.5;
          margin: 0;
        }
        :global(.inclusive-link) {
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
          text-decoration: none;
          margin-top: 4px;
        }
        :global(.inclusive-link:hover) {
          text-decoration: underline;
        }

        .lb-layout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
          width: 100%;
          align-items: flex-start;
        }

        .lb-main-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }

        .lb-side-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        @media (max-width: 960px) {
          .lb-layout-grid {
            grid-template-columns: 1fr;
          }
          .lb-obsidian-banner {
            padding: 1.75rem;
          }
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
            /* 
              ── WHAT: ────────────────────────────────────────────────────────
              Mobile leaderboard page padding.
              
              ── WHY: ─────────────────────────────────────────────────────────
              Per AGENTS.md Rule 2.3, the fixed site footer requires at least 6.5rem
              clearance so pagination controls and search entries are never covered.
              
              ── WHERE & WHEN TO USE: ─────────────────────────────────────────
              Leaderboard mobile media queries.
              
              ── USE CASES: ───────────────────────────────────────────────────
              Small-screen viewports (<= 520px).
              
              ── WHEN NOT TO USE: ─────────────────────────────────────────────
              Desktop viewports.
            */
            padding: 1.25rem 0.75rem 6.5rem;
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
