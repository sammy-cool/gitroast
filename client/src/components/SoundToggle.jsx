'use client'

// ============================================================
// GITROAST — Sound FX Toggle Component
// ============================================================
/**
 * WHAT: Accessible sound effects mute/unmute toggle button with persistent state.
 * WHY: Gives users immediate, one-click agency over audio feedback with clear visual states.
 * WHERE & WHEN TO USE: Placed in the top navigation bar or floating corner across all pages.
 * USE CASES: User wants silent browsing or wants to re-enable fiery audio feedback.
 * WHEN NOT TO USE: In headless environments or during SSR passes.
 */

import { useCallback, useSyncExternalStore } from 'react'
import { isMuted, toggleMute, playClick } from '@/utils/soundFX'
import { toast } from '@/utils/toast'

const subscribe = () => () => {}

function subscribeSound(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('gitroast-sound-toggle', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('gitroast-sound-toggle', callback)
    window.removeEventListener('storage', callback)
  }
}

export default function SoundToggle() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false)
  const muted = useSyncExternalStore(subscribeSound, isMuted, () => false)

  const handleToggle = useCallback(() => {
    const newMuted = toggleMute()
    if (!newMuted) {
      playClick()
      toast.info('Sound FX enabled 🔊', { duration: 2500 })
    } else {
      toast.info('Sound FX muted 🔇', { duration: 2500 })
    }
  }, [])

  if (!isClient) return null

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`sound-toggle-btn ${muted ? 'sound-toggle-btn--muted' : 'sound-toggle-btn--active'}`}
      title={muted ? 'Unmute Sound FX (Audio Muted)' : 'Mute Sound FX (Audio Active)'}
      aria-label={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
    >
      <span className="sound-toggle-icon" aria-hidden="true">
        {muted ? '🔇' : '🔊'}
      </span>
      <span className="sound-toggle-text font-mono">
        {muted ? 'MUTED' : 'FX ON'}
      </span>

      <style jsx>{`
        .sound-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(20, 20, 20, 0.75);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 5px 9px;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.18s ease;
          backdrop-filter: blur(8px);
          user-select: none;
        }
        .sound-toggle-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 69, 0, 0.4);
          background: rgba(255, 69, 0, 0.08);
        }
        .sound-toggle-btn--active {
          border-color: rgba(255, 107, 0, 0.3);
        }
        .sound-toggle-btn--active .sound-toggle-icon {
          animation: pulseSpeaker 2s infinite ease-in-out;
        }
        .sound-toggle-btn--muted {
          opacity: 0.65;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .sound-toggle-icon {
          font-size: 12px;
          line-height: 1;
        }
        .sound-toggle-text {
          font-size: 10px;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        @keyframes pulseSpeaker {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @media (max-width: 520px) {
          .sound-toggle-text {
            display: none;
          }
          .sound-toggle-btn {
            padding: 5px 7px;
          }
        }
      `}</style>
    </button>
  )
}
