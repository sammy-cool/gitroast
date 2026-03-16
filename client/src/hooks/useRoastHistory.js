'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRoastHistory } from '@/services/roastService'

// WHY: accepts username as param so hook is reusable
//      for any profile — history page, result page, etc.
export function useRoastHistory(username) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // WHY useCallback: stable fetch function
    //     safe to call from useEffect + retry button
    const fetchHistory = useCallback(async () => {
        if (!username) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await getRoastHistory(username)
            setHistory(res.history || [])
        } catch (err) {
            setError(err.message || 'Failed to load history')
            setHistory([])
        } finally {
            setLoading(false)
        }
    }, [username])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // ── Derived data ────────────────────────────────────────
    // WHY: compute these once here, not in every component

    // Latest vs previous roast score difference
    const scoreTrend = history.length >= 2
        ? history[0].score - history[1].score
        : null

    // Best (lowest) score ever
    const bestScore = history.length > 0
        ? Math.min(...history.map(r => r.score))
        : null

    // Worst (highest) score ever
    const worstScore = history.length > 0
        ? Math.max(...history.map(r => r.score))
        : null

    // Average score
    const avgScore = history.length > 0
        ? Math.round(history.reduce((s, r) => s + r.score, 0) / history.length)
        : null

    // WHY: group roasts by month for comparison chart
    const byMonth = history.reduce((acc, roast) => {
        const month = new Date(roast.createdAt)
            .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (!acc[month]) acc[month] = []
        acc[month].push(roast)
        return acc
    }, {})

    return {
        history,
        loading,
        error,
        refetch: fetchHistory,
        // Derived
        scoreTrend,
        bestScore,
        worstScore,
        avgScore,
        byMonth,
        hasHistory: history.length > 0,
        roastCount: history.length,
    }
}
