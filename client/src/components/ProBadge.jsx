// WHY: reusable badge shown wherever Pro status matters
//      navbar, roast card, leaderboard rows
export default function ProBadge({ size = 'sm' }) {
    return (
        <>
            <span className={`pro-badge font-mono size-${size}`}>
                PRO ⚡
            </span>
            <style jsx>{`
        .pro-badge {
          display:        inline-block;
          padding:        2px 7px;
          background:     rgba(255, 69, 0, 0.12);
          border:         1px solid var(--fire);
          border-radius:  4px;
          color:          var(--fire);
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space:    nowrap;
        }
        .size-sm { font-size: 10px; }
        .size-md { font-size: 12px; padding: 3px 9px; }
        .size-lg { font-size: 14px; padding: 4px 12px; }
      `}</style>
        </>
    )
}