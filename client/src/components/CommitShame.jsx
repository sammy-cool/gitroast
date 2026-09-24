export default function CommitShame({ commits }) {
    // ── Safe Commits Array Guard ────────────────────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Verifies that commits prop is a non-empty array before attempting to render tags.
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Prevents TypeError: commits.map is not a function if an unexpected object or string is passed.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // At the entry point of all array-mapping presentation components.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // Displaying shameful commit messages on roast cards and badges.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not use if component supports polymorphic data types (e.g. single item fallback).
    if (!Array.isArray(commits) || commits.length === 0) return null

    return (
        <div className="commit-shame">
            <p className="shame-label font-mono">
                🏆 Hall of Shame — Recent Commits
            </p>

            <div className="commit-list">
                {commits.map((msg, i) => (
                    <span key={i} className="commit-tag font-mono">
                        &ldquo;{msg}&rdquo;
                    </span>
                ))}
            </div>

            <style jsx>{`
        .commit-shame {
          padding:       1rem 1.25rem;
          background:    #080808;
          border-bottom: 1px solid var(--border);
        }
        .shame-label {
          color:          var(--text-muted);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom:  10px;
        }
        .commit-list {
          display:   flex;
          flex-wrap: wrap;
          gap:       6px;
        }
        .commit-tag {
          background:    #111;
          border:        1px solid #1E1E1E;
          border-radius: var(--radius-sm);
          padding:       4px 10px;
          color:         var(--bad);
          font-size:     12px;
          line-height:   1.5;
        }
      `}</style>
        </div>
    )
}