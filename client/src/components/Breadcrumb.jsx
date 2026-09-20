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
//   - Consistency: Responsive, accessible colors, mobile scrollable with hidden scrollbar.
//   - Fluid width: Takes 100% of parent wrapper width to align with page grid.
// ============================================================

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav font-mono">
      <ol
        className="breadcrumb-list"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              className="breadcrumb-item"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="breadcrumb-current"
                  aria-current="page"
                  itemProp="name"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="breadcrumb-link"
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .breadcrumb-nav {
          width: 100%;
          padding: 4px 0;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .breadcrumb-nav::-webkit-scrollbar {
          display: none;
        }
        .breadcrumb-list {
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb-separator {
          color: rgba(255, 255, 255, 0.25);
          font-weight: 300;
          user-select: none;
        }
        .breadcrumb-link {
          color: #8e8e8e;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .breadcrumb-link:hover {
          color: var(--fire, #ff4500);
        }
        .breadcrumb-current {
          color: var(--text-primary, #f5f5f5);
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
}
