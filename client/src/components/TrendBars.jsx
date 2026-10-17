// Calm bar chart used for trends ("Explain first. Decorate second.").
// Pale bars for history, ember for the latest. Source and window stay visible via the caption.
export default function TrendBars({ values = [], labels = [], caption = '', height = 140, ariaLabel = 'Score trend' }) {
  const nums = values.filter((v) => typeof v === 'number')
  if (nums.length < 2) {
    return <p className="gr-help">Not enough history yet. A trend appears after two roasts.</p>
  }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = Math.max(1, max - min)
  return (
    <figure className="tb" style={{ '--tb-h': `${height}px` }}>
      <div className="tb__bars" role="img" aria-label={`${ariaLabel}: ${nums.join(', ')}`}>
        {nums.map((v, i) => {
          const pct = 28 + ((v - min) / span) * 72 // keep the lowest bar visible
          const last = i === nums.length - 1
          return (
            <span key={i} className="tb__col" title={`${labels[i] ? labels[i] + ': ' : ''}${v}`}>
              <i className={`tb__bar${last ? ' tb__bar--last' : ''}`} style={{ height: `${pct}%` }} />
              {labels[i] ? <small>{labels[i]}</small> : null}
            </span>
          )
        })}
      </div>
      {caption ? <figcaption className="gr-help">{caption}</figcaption> : null}
      <style jsx>{`
        .tb { display: grid; gap: 8px; margin: 0; }
        .tb__bars { display: flex; align-items: flex-end; gap: 8px; height: var(--tb-h); }
        .tb__col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; gap: 4px; }
        .tb__bar { display: block; width: 100%; border-radius: 6px 6px 2px 2px; background: var(--surface-2); transition: height var(--t-cele) var(--ease-out); }
        .tb__bar--last { background: var(--ember); }
        .tb__col small { text-align: center; font: 400 10px var(--font-code); color: var(--ink-3); }
      `}</style>
    </figure>
  )
}
