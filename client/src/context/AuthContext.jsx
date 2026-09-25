'use client'

// ============================================================
// GITROAST — Authentication Context & State Provider
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// React Context and custom hook (`useAuth`) that encapsulates client-side authentication state,
// manages persistent JWT tokens in `localStorage`, synchronizes session state with the backend,
// and supplies login, logout, and token retrieval functions across all React components.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Single Source of Truth: Eliminates prop drilling for user data (`user`, `isPro`, `isLoggedIn`).
// 2. Performance Optimization: Uses `useMemo` on context values and `useCallback` on handler methods
//    to eliminate unnecessary re-renders of the component tree.
// 3. Resilient Session Hydration: Recovers active sessions from `localStorage` on page mount,
//    gracefully handling invalid/expired tokens without breaking the application.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • Wrap at the root in `client/src/app/layout.jsx` via `<AuthProvider>`.
// • Consume in any client component via `const { user, isPro, loginWithGitHub } = useAuth()`.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Displaying user avatar and Pro badge in the top navigation bar.
// • Unlocking high-res watermark-free image downloads for Pro users.
// • Suppressing guest-only login nudges and rate limit warnings for authenticated developers.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use in React Server Components (`page.jsx` without 'use client'); Server Components
//   do not have access to React Context or browser `localStorage`.
// • DO NOT store raw passwords or sensitive credentials in AuthContext state.
// ============================================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'

const AuthContext = createContext(null)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'gitroast_token'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Fetch current user profile ──────────────────────────
    // WHY useCallback: stable function reference
    //     safe to use in useEffect dependency arrays
    const fetchMe = useCallback(async (token) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                // ── Explicit Auth Rejection ──────────────────────────────────
                // ── WHAT: Clears stored session only if server explicitly rejects token.
                // ── WHY: 500 server errors or rate-limits must not wipe valid sessions.
                // ── WHERE & WHEN TO USE: On authenticated identity verification requests.
                // ── USE CASES: Expired tokens, revoked access.
                // ── WHEN NOT TO USE: On network blips or cold start 504 gateway timeouts.
                if (res.status === 401 || res.status === 403) {
                    try { localStorage.removeItem(TOKEN_KEY); } catch {}
                    setUser(null);
                }
                return;
            }

            const json = await res.json();
            setUser(json.user);
        } catch {
            // WHY: Never purge token on transient network timeouts or Render cold starts.
            // Preserving the stored token allows automatic recovery once the server wakes.
        } finally {
            setLoading(false);
        }
    }, [])

    // ── Restore session on page load ────────────────────────
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            fetchMe(token)
        } else {
            setLoading(false)
        }
    }, [fetchMe])

    // ── Re-fetch user profile (e.g. after payment or profile change) ───
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            return await fetchMe(token)
        }
        return null
    }, [fetchMe])

    // ── Save token + set user (called from callback page) ───
    const loginWithToken = useCallback((token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token)
        }
        fetchMe(token)
    }, [fetchMe])

    // ── Get stored token for API calls ──────────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Safely reads the active JWT authentication token from browser localStorage.
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Checking typeof window prevents ReferenceError: localStorage is not defined
    // during Next.js Server-Side Rendering (SSR) passes.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // In any context method or hook called across client and server boundaries.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // Supplying Bearer tokens for authenticated fetch requests.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not use to store non-expiring credentials or sensitive private keys.
    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(TOKEN_KEY)
    }, [])

    // ── Logout ───────────────────────────────────────────────
    const logout = useCallback(async () => {
        const token = getToken()
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
        } catch {
            // WHY: logout should always succeed locally
            //      even if server call fails
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY)
        }
        setUser(null)
    }, [getToken])

    // ── Initiate GitHub OAuth flow ───────────────────────────
    // WHY: redirect to our server which then redirects to GitHub
    const loginWithGitHub = useCallback(() => {
        window.location.href = `${API_BASE}/api/auth/github`
    }, [])

    const value = useMemo(() => ({
        user,
        loading,
        isLoggedIn: !!user,
        isPro: user?.isPro || false,
        loginWithGitHub,
        loginWithToken,
        getToken,
        logout,
        refreshUser,
    }), [user, loading, loginWithGitHub, loginWithToken, getToken, logout, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// WHY custom hook: cleaner imports throughout the app
//   usage: const { user, isPro, loginWithGitHub } = useAuth()
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>')
    }
    return ctx
}