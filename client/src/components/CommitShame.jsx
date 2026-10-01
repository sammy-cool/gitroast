// Rule 7: Eradicate all remaining hardcoded Dark Mode Hex Codes. Switched to Luminous light-mode variables.
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
                Commit Shame List
            </p>

            <div className="commit-list">
                {commits.map((msg, i) => (
                    <span key={i} className="commit-tag font-mono">
                        {msg}
                    </span>
                ))}
            </div>

            <style jsx>{`
        /* 
          ── WHAT: ────────────────────────────────────────────────────────
          Commit Shame List container styled according to approved mockup.
          ── WHY: ─────────────────────────────────────────────────────────
          Matches storage/assets/roast_result_mockup_1790869183501.jpg.
          ── WHERE & WHEN TO USE: ─────────────────────────────────────────
          Rendered inside RoastCard to highlight questionable commit messages.
          ── USE CASES: ───────────────────────────────────────────────────
          Highlighting 'wip', 'final fix 2', 'force push 3am' commit tags.
          ── WHEN NOT TO USE: ─────────────────────────────────────────────
          Do not render when commits array is empty.
        */
        .commit-shame {
          padding:       1.25rem 1.5rem;
          background:    var(--bg-card, #FFFFFF);
          border-bottom: 1px solid var(--border, #E5E7EB);
        }
        .shame-label {
          color:          var(--text-primary, #111827);
          font-size:      14px;
          font-weight:    700;
          letter-spacing: 0.3px;
          margin-bottom:  10px;
        }
        .commit-list {
          display:   flex;
          flex-wrap: wrap;
          gap:       8px;
        }
        .commit-tag {
          background:    #DC2626;
          border:        none;
          border-radius: 9999px;
          padding:       5px 14px;
          color:         #FFFFFF;
          font-size:     12px;
          font-weight:   600;
          line-height:   1.4;
          box-shadow:    0 2px 6px rgba(220, 38, 38, 0.25);
        }
      `}</style>
        </div>
    )
}