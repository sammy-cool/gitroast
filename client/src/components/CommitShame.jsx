export default function CommitShame({ commits }) {
    // WHY: if no commits found, don't render this section at all
    if (!commits || commits.length === 0) return null

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