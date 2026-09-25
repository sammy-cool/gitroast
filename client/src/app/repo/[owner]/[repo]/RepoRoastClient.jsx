'use client'

// ============================================================
// GITROAST — RepoRoastClient Component
// ============================================================
// WHAT: Client controller for repository deep roast analysis
//       Drives analysis loading state, fetches analysis from backend,
//       and renders RepoRoastCard with error handling & toasts.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createToast } from 'customizable-toast-notification'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RepoRoastCard from '@/components/RepoRoastCard'
import ProModal from '@/components/ProModal'
import Breadcrumb from '@/components/Breadcrumb'
import { getRepoRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'

const MIN_ANALYSIS_TIME = 4500

export default function RepoRoastClient({ owner, repo }) {
  const [view, setView] = useState('analyzing')
  const [roastData, setRoastData] = useState(null)
  const [showProModal, setShowProModal] = useState(false)
  const router = useRouter()
  const { getToken } = useAuth()

  // ── Idempotency Key ──────────────────────────────────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // Stable idempotency token generated per mount lifecycle.
  // ── WHY: ─────────────────────────────────────────────────────
  // Prevents duplicate GitHub API repository fetches and double daily quota
  // deductions caused by React StrictMode double mounts or rapid tab switching.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // Any computational or quota-sensitive analytical client fetch.
  // ── USE CASES: ───────────────────────────────────────────────
  // Repository roasts, profile roasts.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Passive telemetry pings or search queries.
  const idempotencyKey = useRef('')

  useEffect(() => {
    if (!idempotencyKey.current && owner && repo) {
      idempotencyKey.current = `repo-${owner}-${repo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    if (!owner || !repo) {
      createToast({ type: 'error', message: 'Invalid repository target.', position: 'top-center' })
      router.push('/')
      return
    }

    let cancelled = false

    async function fetchRepo() {
      // ── Repository Session Cache (5m TTL) ────────────────────────
      // ── WHAT: ────────────────────────────────────────────────────
      // Caches repository roast results in sessionStorage by owner and repo name.
      // ── WHY: ─────────────────────────────────────────────────────
      // Prevents redundant GitHub API requests, rate-limit deductions, and AI token
      // usage when navigating back from other tabs or reloading the page.
      // ── WHERE & WHEN TO USE: ─────────────────────────────────────
      // Inside repository inspection client mount effect before executing fetch.
      // ── USE CASES: ───────────────────────────────────────────────
      // User inspects a repo, navigates to badge generator, and hits back.
      // ── WHEN NOT TO USE: ─────────────────────────────────────────
      // When an explicit force re-analyze button is provided.
      const cacheKey = `gitroast_repo_${owner}_${repo}`
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
            if (cancelled) return
            setRoastData(parsed.data)
            setView('result')
            return
          }
        }
      } catch {
        // Ignore sessionStorage exceptions in private mode
      }
      try {
        const token = getToken()
        const intensity = sessionStorage.getItem('gitroast_intensity') || 'savage'

        const [data] = await Promise.all([
          getRepoRoast(owner, repo, token, intensity, idempotencyKey.current),
          new Promise((resolve) => setTimeout(resolve, MIN_ANALYSIS_TIME)),
        ])

        if (cancelled) return

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
        } catch {
          // Ignore storage quota exceeded
        }

        setRoastData(data)
        setView('result')

        createToast({
          type: 'success',
          message: `🔥 Repository "${owner}/${repo}" roasted!`,
          position: 'top-center',
          showProgressBar: true,
          duration: 3500,
        })
      } catch (err) {
        if (cancelled) return
        setView('error')

        if (err.status === 404 || err.code === 'REPO_NOT_FOUND') {
          createToast({
            type: 'error',
            message: `Repository "${owner}/${repo}" not found or is private.`,
            position: 'top-center',
            duration: 6000,
          })
        } else if (err.status === 429) {
          createToast({
            type: 'warning',
            message: '⏱ GitHub rate limit exceeded. Please log in or wait 60s.',
            position: 'top-center',
            duration: 6000,
          })
        } else {
          createToast({
            type: 'error',
            message: err.message || 'Failed to roast repository.',
            position: 'top-center',
            duration: 6000,
          })
        }
      }
    }

    fetchRepo()

    return () => {
      cancelled = true
    }
  }, [owner, repo, router, getToken])

  return (
    <main className="repo-page">
      <div className="landing-glow animate-glow" />

      {view === 'analyzing' && (
        <AnalyzingScreen
          username={`${owner}/${repo}`}
          intensity={sessionStorage.getItem('gitroast_intensity') || 'savage'}
        />
      )}

      {view === 'result' && roastData && (
        <div className="result-container animate-fadeUp">
          <div className="back-nav">
            <Link href="/" className="back-link font-mono">
              ← Back to GitRoast
            </Link>
          </div>
          <div className="breadcrumb-wrap">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: `@${owner}`, href: `/history/${owner}` },
                { label: `${repo}` },
              ]}
            />
          </div>
          <RepoRoastCard
            data={roastData}
            onProClick={() => setShowProModal(true)}
          />
        </div>
      )}

      {view === 'error' && (
        <div className="error-card card animate-fadeUp">
          <p className="error-icon">💀</p>
          <h2 className="error-title font-display">Repo Roasting Failed</h2>
          <p className="error-msg font-mono">
            Could not analyze `{owner}/{repo}`. The repo might be private, empty, or rate limited.
          </p>
          <div className="error-actions">
            <Link href="/" className="btn btn-primary font-mono">
              Try Another Target
            </Link>
          </div>
        </div>
      )}

      {showProModal && (
        <ProModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
        />
      )}

      <style jsx>{`
        .repo-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem 6.5rem;
          position: relative;
          overflow-x: hidden;
        }
        .landing-glow {
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 69, 0, 0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .result-container {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          z-index: 1;
        }
        .breadcrumb-wrap {
          width: 100%;
          margin-top: -0.5rem;
        }
        .back-nav {
          display: flex;
          align-items: center;
        }
        .back-link {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #ff6b00;
        }
        .error-card {
          width: 100%;
          max-width: 480px;
          padding: 2.5rem 2rem;
          text-align: center;
          background: #111;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          z-index: 1;
        }
        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .error-title {
          font-size: 2rem;
          margin-bottom: 0.75rem;
          color: var(--bad);
        }
        .error-msg {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .error-actions {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </main>
  )
}
