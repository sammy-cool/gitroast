'use client'

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
                // WHY: token expired or invalid — clean up
                localStorage.removeItem(TOKEN_KEY)
                setUser(null)
                return
            }

            const json = await res.json()
            setUser(json.user)
        } catch {
            localStorage.removeItem(TOKEN_KEY)
            setUser(null)
        } finally {
            setLoading(false)
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
        localStorage.setItem(TOKEN_KEY, token)
        fetchMe(token)
    }, [fetchMe])

    // ── Get stored token for API calls ──────────────────────
    const getToken = useCallback(() => {
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
        localStorage.removeItem(TOKEN_KEY)
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