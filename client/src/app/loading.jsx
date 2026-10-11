export default function Loading() {
  return (
    <div className="gr-status" role="status" aria-live="polite">
      <div className="gr-status__card" style={{ justifyItems: 'center', textAlign: 'center' }}>
        <span className="gr-spinner" aria-hidden="true" />
        <p className="gr-eyebrow">Loading</p>
        <p className="gr-help">Reading the receipts…</p>
      </div>
    </div>
  )
}
