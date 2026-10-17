'use client'


import { notify } from '@/utils/toast'
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'
import { updateUserPreferences } from '@/services/roastService'

const AuthContext = createContext(null)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'gitroast_token'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchMe = useCallback(async (token) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    try { localStorage.removeItem(TOKEN_KEY); } catch {}
                    setUser(null);
                    notify.sessionExpired({
                        what: 'your history',
                        onAction: () => { window.location.href = `${API_BASE}/api/auth/github` },
                    });
                }
                return;
            }

            const json = await res.json();
            setUser(json.user);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            fetchMe(token)
        } else {
            setLoading(false)
        }
    }, [fetchMe])

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            return await fetchMe(token)
        }
        return null
    }, [fetchMe])

    const loginWithToken = useCallback((token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token)
        }
        fetchMe(token)
    }, [fetchMe])

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(TOKEN_KEY)
    }, [])

    const logout = useCallback(async () => {
        const token = getToken()
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
        } catch {
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY)
        }
        setUser(null)
    }, [getToken])

    const loginWithGitHub = useCallback(() => {
        window.location.href = `${API_BASE}/api/auth/github`
    }, [])

    const updatePreferences = useCallback(async (newPreferences) => {
        const token = getToken()
        if (!token) return null
        const data = await updateUserPreferences(newPreferences, token)
        if (data?.user) {
            setUser(data.user)
        }
        return data
    }, [getToken])

    const value = useMemo(() => ({
        user,
        loading,
        isLoggedIn: !!user,
        isPro: user?.isPro || false,
        proPlan: user?.proPlan || (user?.isPro ? 'roaster' : 'none'),
        isHistorian: user?.proPlan === 'historian',
        loginWithGitHub,
        loginWithToken,
        getToken,
        logout,
        refreshUser,
        updatePreferences,
    }), [user, loading, loginWithGitHub, loginWithToken, getToken, logout, refreshUser, updatePreferences]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>')
    }
    return ctx
}

