// WHY no 'use client': loading.jsx works as server component
//     Next.js renders this instantly during route transitions
//     no hooks needed — pure UI

// WHY loading.jsx:
//   Next.js App Router shows this automatically between
//   route changes while the next page is loading
//   without it → white flash between pages
//   with it → seamless branded transition
'use client'

export default function Loading() {
  return (
    <div className="loading-page">

      <div className="loading-glow" />

      {/* Logo stays visible during transition */}
      <p
        className="font-display loading-logo"
        style={{
          background:              'linear-gradient(135deg, #FF4500, #FF6B00, #FFB700)',
          WebkitBackgroundClip:    'text',
          WebkitTextFillColor:     'transparent',
          backgroundClip:          'text',
          fontSize:                '28px',
        }}
      >
        GITROAST 🔥
      </p>

      {/* WHY terminal-style loader: matches AnalyzingScreen aesthetic
          consistent with brand throughout the app */}
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

        {/* Progress bar — same style as PaymentFlow loader */}
        <div className="loading-track">
          <div className="loading-fill" />
        </div>
      </div>

      <style jsx>{`
        .loading-page {
          min-height:      100vh;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          justify-content: center;
          gap:             1.5rem;
          background:      #070707;
          position:        relative;
          overflow:        hidden;
        }
        .loading-glow {
          position:       absolute;
          inset:          0;
          background:     radial-gradient(
            ellipse 60% 40% at 50% 100%,
            rgba(255, 69, 0, 0.12) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .loading-card {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            1rem;
          width:          200px;
        }

        /* WHY staggered dots: gives life to loading state
           each dot fades in at different delay
           creates natural "loading..." rhythm */
        .loading-dot {
          display:   inline-block;
          animation: dotPulse 1.4s ease-in-out infinite;
          color:     var(--fire);
        }
        .loading-dot:nth-child(1) { animation-delay: 0s;    }
        .loading-dot:nth-child(2) { animation-delay: 0.2s;  }
        .loading-dot:nth-child(3) { animation-delay: 0.4s;  }

        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; }
          40%            { opacity: 1;   }
        }

        /* Progress bar */
        .loading-track {
          width:         100%;
          height:        2px;
          background:    var(--border);
          border-radius: 2px;
          overflow:      hidden;
        }
        .loading-fill {
          height:        100%;
          background:    linear-gradient(135deg, #FF4500, #FF6B00, #FFB700);
          border-radius: 2px;
          animation:     loadingBar 1.8s ease-in-out infinite;
        }
        @keyframes loadingBar {
          0%   { width: 0%;   margin-left: 0;    }
          50%  { width: 70%;  margin-left: 15%;  }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
