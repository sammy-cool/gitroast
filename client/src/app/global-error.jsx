'use client'

// Catches errors thrown in the root layout itself (error.jsx cannot). Must render its own <html>/<body>,
// so it uses inline styles with the brand colours instead of relying on the app stylesheet.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#F3EFE8', color: '#171711', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
        <main role="alert" style={{ maxWidth: 520, display: 'grid', gap: 14 }}>
          <p style={{ margin: 0, font: '600 11px ui-monospace, Menlo, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B83C1D' }}>Something broke</p>
          <h1 style={{ margin: 0, font: '400 44px/1.05 Georgia, serif' }}>GitRoast blinked.</h1>
          <p style={{ margin: 0, color: '#5F5A52', fontSize: 17 }}>This one is on us. Nothing was charged and your data was not changed.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => reset()} style={{ minHeight: 44, padding: '0 20px', borderRadius: 999, border: 0, background: '#D14626', color: '#fff', font: '600 15px system-ui, sans-serif', cursor: 'pointer' }}>Try again</button>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 20px', borderRadius: 999, border: '1px solid #CFC6B5', color: '#171711', textDecoration: 'none', font: '600 15px system-ui, sans-serif' }}>Go home</a>
          </div>
        </main>
      </body>
    </html>
  )
}
