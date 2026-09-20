'use client'

import { useSyncExternalStore } from 'react'
import { createToast } from 'customizable-toast-notification'
import { useAuth } from '@/context/AuthContext'

const subscribe = () => () => {}

export default function GitHubLoginBtn({ variant = 'full' }) {
    const { user, isPro, loading, loginWithGitHub, logout } = useAuth()

    // WHY mounted: prevents hydration mismatch
    //     server renders nothing → client renders correct state
    //     avoids server HTML vs client HTML conflict
    const mounted = useSyncExternalStore(subscribe, () => true, () => false)

    // WHY placeholder instead of null:
    //   return null = empty space = layout shifts when button appears
    //   placeholder = same size as real button = zero layout shift
    //   pulse animation = tells user something is loading here
    //
    // WHY variant-specific sizes:
    //   compact → used in navbars → fixed ~120px wide × 34px tall
    //   full    → used in forms  → full width × 50px tall
    //   sizes match the real button dimensions exactly
    if (!mounted || loading) {
        return (
            <div
                style={{
                    width: variant === 'compact' ? '130px' : '100%',
                    height: variant === 'compact' ? '34px' : '50px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    flexShrink: 0,   // WHY: prevents collapsing in flex navbars
                }}
            />
        )
    }

    // ── Logged in ─────────────────────────────────────────
    if (user) {
        return (
            <div className="user-pill">
                {user.avatarUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="user-avatar"
                        loading="eager"
                    />
                )}
                <span className="font-mono user-name">@{user.username}</span>
                {isPro && (
                    <span className="pro-badge font-mono">PRO ⚡</span>
                )}
                <button
                    className="btn btn-ghost logout-btn"
                    onClick={() => {
                        logout()
                        createToast({
                            type: 'info',
                            message: 'Logged out successfully.',
                            position: 'top-center',
                            duration: 3000,
                        })
                    }}
                >
                    Logout
                </button>

                <style jsx>{`
          .user-pill {
            display:     flex;
            align-items: center;
            gap:         8px;
          }
          .user-avatar {
            width:         28px;
            height:        28px;
            border-radius: 50%;
            border:        1px solid var(--border);
          }
          .user-name { font-size: 13px; color: var(--text-secondary); }
          .pro-badge {
            font-size:     10px;
            padding:       2px 7px;
            background:    rgba(255, 69, 0, 0.15);
            border:        1px solid var(--fire);
            border-radius: 4px;
            color:         var(--fire);
          }
          .logout-btn { padding: 4px 10px; font-size: 12px; }
        `}</style>
            </div>
        )
    }

    // ── Not logged in ─────────────────────────────────────
    return (
        <>
            <button
                onClick={loginWithGitHub}
                className={`btn github-btn ${variant === 'full' ? 'btn-full' : 'btn-compact'
                    }`}
            >
                <svg
                    width="16" height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {variant === 'full'
                    ? '🔥 Connect GitHub → Unlock Pro'
                    : 'Connect GitHub'}
            </button>

            <style jsx>{`
        .github-btn {
          display:     flex;
          align-items: center;
          gap:         8px;
          color:       #fff;
          background:  var(--fire-grad);
        }
        .github-btn:hover {
          opacity:    0.9;
          transform:  translateY(-1px);
          box-shadow: 0 6px 24px rgba(255,69,0,.3);
        }
        .btn-full    { width: 100%; padding: 14px; font-size: 15px; }
        .btn-compact { padding: 8px 14px; font-size: 13px; }
      `}</style>
        </>
    )
}