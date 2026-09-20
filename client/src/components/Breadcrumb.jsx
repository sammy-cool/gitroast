'use client';

import Link from 'next/link';

// ============================================================
// GITROAST — Dynamic Breadcrumb Navigation
// ============================================================
// WHAT: Provides clear hierarchical navigation across the application
//       with Schema.org BreadcrumbList structured data support.
// WHY:
//   - UX: Orient users immediately on deep pages (/battle/user1/vs/user2,
//     /history/torvalds, /repo/owner/repo).
//   - SEO: Emits valid JSON-LD / Microdata for Google rich snippet breadcrumbs.
//   - Consistency: Responsive, fire-themed separators, mobile scrollable.
// ============================================================

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav font-mono">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
              {isLast || !item.href ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .breadcrumb-nav {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          padding: 6px 0;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
        }
        .breadcrumb-list {
          display: flex;
          align-items: center;
          gap: 8px;
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .breadcrumb-separator {
          color: var(--text-muted);
          opacity: 0.6;
          user-select: none;
        }
        .breadcrumb-link {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .breadcrumb-link:hover {
          color: var(--fire);
        }
        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
}
