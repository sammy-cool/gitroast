export default function Loading() {
  return (
    <div className="loading-page">
      <div className="loading-glow" />

      <p
        className="font-display loading-logo"
        style={{
          background: 'linear-gradient(135deg, #FF4500, #FF6B00, #FFB700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '28px',
        }}
      >
        GITROAST 🔥
      </p>

      <div className="loading-card">
        <p
          className="font-mono loading-text"
          style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
        >
          Loading
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
          <span className="loading-dot">.</span>
        </p>

        <div className="loading-track">
          <div className="loading-fill" />
        </div>
      </div>
    </div>
  )
}
