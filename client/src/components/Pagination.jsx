'use client';

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }

  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  hasPrev = false,
  hasNext = false,
  onPageChange,
  loading = false,
}) {
  if (total === 0) return null;

  const fromIndex = (page - 1) * limit + 1;
  const toIndex = Math.min(total, page * limit);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="lb-pagination" role="navigation" aria-label="Pagination">
      {/* ── Summary Info ── */}
      <div className="lb-page-info font-mono">
        Showing{' '}
        <span className="info-highlight text-fire">
          {fromIndex}–{toIndex}
        </span>{' '}
        of{' '}
        <span className="info-highlight text-fire">
          {total}
        </span>{' '}
        shameful profiles
      </div>

      {/* ── Controls (only when > 1 page) ── */}
      {totalPages > 1 && (
        <div className="lb-page-controls">
          <button
            type="button"
            className="btn btn-ghost lb-nav-btn font-mono"
            disabled={!hasPrev || loading}
            onClick={() => onPageChange(page - 1)}
            aria-label="Go to previous page"
          >
            ← Prev
          </button>

          <div className="lb-page-numbers">
            {pageNumbers.map((p, idx) =>
              p === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="lb-ellipsis font-mono"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  className={`lb-page-btn font-mono ${
                    p === page ? 'active' : ''
                  }`}
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="btn btn-ghost lb-nav-btn font-mono"
            disabled={!hasNext || loading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Go to next page"
          >
            Next →
          </button>
        </div>
      )}

      <style jsx>{`
        .lb-pagination {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          padding: 1.1rem 1.25rem;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
          width: 100%;
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
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lb-page-btn:hover:not(.active):not(:disabled) {
          border-color: #ff6b00;
          color: var(--text-primary);
        }

        .lb-page-btn.active {
          background: linear-gradient(135deg, #ff4500 0%, #ff6b00 50%, #ffb700 100%);
          color: #070707;
          font-weight: 700;
          border: none;
          box-shadow: 0 0 12px rgba(255, 69, 0, 0.4);
        }

        .lb-ellipsis {
          color: var(--text-muted);
          font-size: 14px;
          padding: 0 4px;
        }

        @media (max-width: 520px) {
          .lb-pagination {
            padding: 0.85rem 0.75rem;
            gap: 0.65rem;
          }

          .lb-page-info {
            font-size: 10px;
          }

          .lb-page-controls {
            gap: 0.35rem;
          }

          .lb-nav-btn {
            height: 28px;
            padding: 2px 8px;
            font-size: 11px;
          }

          .lb-page-btn {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
