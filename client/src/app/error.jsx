'use client'

export default function GlobalError({ error, reset }) {
  return (
    <main className="gr-status">
      <div className="gr-card gr-card--ember gr-status__card" role="alert">
        <p className="gr-eyebrow">Something broke</p>
        <h1 className="gr-h2">GitRoast blinked.</h1>
        <p className="gr-lede">This one is on us. Nothing was charged and your data was not changed. Try again, or head home.</p>
        {process.env.NODE_ENV === 'development' && error?.message && <p className="gr-status__dev">{error.message}</p>}
        <div className="gr-status__actions">
          <button type="button" className="gr-btn gr-btn--primary" onClick={() => reset()}>Try again</button>
          <button type="button" className="gr-btn gr-btn--outline" onClick={() => { window.location.href = '/' }}>Go home</button>
        </div>
      </div>
    </main>
  )
}
