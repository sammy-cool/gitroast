const express = require('express')
const router = express.Router()
const { analyzeProfile } = require('../services/githubService')
const { generateRoast } = require('../services/roastEngine')
const { generateClaudeRoast } = require('../services/claudeService')
const { optionalAuth, requirePro } = require('../middleware/auth')
const Roast = require('../models/Roast')

// WHY Map: O(1) lookup, stores key → timestamp
const processedKeys = new Map()

// WHY: cleanup every 60s — keys only need to live for ~2 seconds
//      prevents memory leak on busy server
setInterval(() => {
    const now = Date.now()
    for (const [key, val] of processedKeys.entries()) {
        if (now - val.time > 60000) processedKeys.delete(key)
    }
}, 60000)

// ─── GET /api/roast/:username ─────────────────────────────
// WHY optionalAuth: works for both free + Pro users
//     req.user = null  → free roast (rule engine)
//     req.user.isPro   → Pro roast (Claude API)
router.get('/:username', optionalAuth, async (req, res) => {
    const { username } = req.params
    const isPro = req.user?.isPro || false

    const idempotencyKey = req.headers['x-idempotency-key']
    // WHY: same key = same StrictMode double mount
    //      different key = new "Roast Again" click = allow
    if (idempotencyKey && processedKeys.has(idempotencyKey)) {
        console.log(`[Roast] StrictMode duplicate blocked`)
        // WHY: return the cached response — user sees correct data
        return res.status(200).json(processedKeys.get(idempotencyKey).response)
    }

    // ── Input validation ─────────────────────────────────
    if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
        return res.status(400).json({
            error: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format.',
        })
    }

    // ── Free user daily limit check ───────────────────────
    // WHY: free users get 1 roast per day
    //      Pro users get unlimited
    if (req.user && !isPro) {
        const canRoast = req.user.canRoastToday()
        if (!canRoast) {
            return res.status(429).json({
                error: 'DAILY_LIMIT_REACHED',
                message: 'Free users get 1 roast per day. Go Pro for unlimited! ⚡',
            })
        }
    }

    try {
        // ── Fetch GitHub data ──────────────────────────────
        // WHY: use user's GitHub token if Pro (private repos)
        //      use default token if free (public only)
        const githubToken = isPro
            ? req.user?.githubAccessToken   // Pro: their personal token
            : null                          // Free: server default token

        const data = await analyzeProfile(username, githubToken)

        // ── Generate roast ─────────────────────────────────
        // WHY: Pro users always get Claude
        //      Free users get rule engine
        //      If Claude fails → fall back to rule engine
        let roast = null
        let roastSource = 'rules'

        if (isPro) {
            // Pro: try Claude first
            roast = await generateClaudeRoast(data)
            if (roast) {
                roastSource = 'claude'
            } else {
                // WHY: Claude failed (API down, timeout etc.)
                //      silently fall back — user still gets a roast
                console.warn(`[Roast] Claude failed for ${username}, using rule engine`)
                roast = generateRoast(data)
            }
        } else {
            // Free: rule engine only
            roast = generateRoast(data)
        }

        // WHY: roast should never be empty — final safety net
        if (!roast || roast.trim().length === 0) {
            roast = `@${username}'s GitHub exists. That's the nicest thing the data supports.`
        }

        data.roast = roast
        data.roastSource = roastSource   // WHY: frontend can show "AI Roast" badge

        // ── Save roast to MongoDB ──────────────────────────
        // WHY try/catch separately: saving to DB should NEVER
        //     block the response — user gets roast regardless
        try {
            const savedRoast = await Roast.create({
                username,
                roastedBy: req.user?._id || null,
                score: data.score,
                grade: data.grade,
                roastText: roast,
                roastSource,
                githubSnapshot: {
                    totalRepos: data.totalRepos,
                    joinYear: data.joinYear,
                    followers: data.followers || 0,
                    topLanguage: data._raw?.topLanguage || '',
                    abandonedCount: data.repoAnalysis?.abandonedCount || 0,
                    commitQuality: data.commitAnalysis?.qualityScore || 0,
                    totalStars: data._raw?.totalStars || 0,
                    hasReadme: data.readme?.exists || false,
                },
                stats: data.stats,
                shameCommits: data.shameCommits,
                isPro: isPro,
            })

            // WHY: send roastId to frontend so Share button
            //      can call /api/history/:id/share to track shares
            data.roastId = savedRoast._id

        } catch (dbErr) {
            // WHY: log but never crash — roast still returns fine
            console.error('[Roast] DB save failed:', dbErr.message)
        }

        // ── Update roast count if logged in ───────────────
        if (req.user) {
            req.user.roastCount += 1
            req.user.lastRoastDate = new Date()
            await req.user.save().catch(e =>
                console.error('[Roast] User save failed:', e.message)
            )
        }

        return res.status(200).json({ success: true, data })

    } catch (err) {

        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                error: 'USER_NOT_FOUND',
                message: `GitHub user "@${username}" does not exist.`,
            })
        }

        if (err.message === 'RATE_LIMIT_EXCEEDED') {
            return res.status(429).json({
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'GitHub rate limit hit. Try again in 60 seconds.',
            })
        }

        console.error(`[RoastRoute] Error for ${username}:`, err.message)
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Something went wrong. Please try again.',
        })
    }
})

// ─── GET /api/roast/:username/pro ─────────────────────────
// WHY: dedicated Pro endpoint — always uses Claude
//      requires auth + Pro status
router.get('/:username/pro', requirePro, async (req, res) => {
    const { username } = req.params

    if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
        return res.status(400).json({
            error: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format.',
        })
    }

    try {
        const data = await analyzeProfile(username, req.user.githubAccessToken)
        const roast = await generateClaudeRoast(data) || generateRoast(data)

        data.roast = roast
        data.roastSource = 'claude'

        return res.status(200).json({ success: true, data })

    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                error: 'USER_NOT_FOUND', message: `"@${username}" not found on GitHub.`,
            })
        }
        console.error(`[ProRoast] Error for ${username}:`, err.message)
        return res.status(500).json({
            error: 'SERVER_ERROR', message: 'Something went wrong.',
        })
    }
})

module.exports = router