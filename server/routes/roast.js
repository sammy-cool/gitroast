const express = require('express')
const router = express.Router()
const { analyzeProfile } = require('../services/githubService')
const { generateRoast } = require('../services/roastEngine')
const { generateAIRoast } = require('../services/aiService')
const { optionalAuth, requirePro } = require('../middleware/auth')
const Roast = require('../models/Roast')

// ─── Idempotency key store ────────────────────────────────
// WHY: prevents StrictMode double-mount from saving 2 roasts
//      same key = same request = return cached response
//      different key = new intentional roast = process fully
// WHY Map: O(1) lookup, stores key → timestamp
const processedKeys = new Map()

// WHY: cleanup every 60s — keys only need to live ~2 seconds
//      prevents memory leak on busy server
setInterval(() => {
    const now = Date.now()
    for (const [key, val] of processedKeys.entries()) {
        if (now - val.time > 60000) processedKeys.delete(key)
    }
}, 60000)

// ─── GET /api/roast/:username ─────────────────────────────
router.get('/:username', optionalAuth, async (req, res) => {
    const { username } = req.params
    const isPro = req.user?.isPro || false
    const idempotencyKey = req.headers['x-idempotency-key']

    // ── Idempotency check ─────────────────────────────────
    // WHY: if we already processed this exact key
    //      return cached response — no DB save, no API call
    if (idempotencyKey && processedKeys.has(idempotencyKey)) {
        console.log(`[Roast] Duplicate blocked: ${idempotencyKey}`)
        return res.status(200).json(
            processedKeys.get(idempotencyKey).response
        )
    }

    // ── Input validation ──────────────────────────────────
    if (
        !username ||
        username.length > 39 ||
        !/^[a-zA-Z0-9-]+$/.test(username)
    ) {
        return res.status(400).json({
            error: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format.',
        })
    }

    // ── Free user daily limit ─────────────────────────────
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
        // ── Fetch GitHub data ─────────────────────────────
        const githubToken = isPro
            ? req.user?.githubAccessToken
            : null

        const data = await analyzeProfile(username, githubToken)

        // ── Generate roast text ───────────────────────────
        let roast = null
        let roastSource = 'rules'
        console.log(isPro,"iprwkp")
        console.log(githubToken,"github")
        console.log(req.user?.githubAccessToken,"req.user?.githubAccessToken")
        if (isPro) {
            roast = await generateAIRoast(data)
            if (roast) {
                roastSource = 'ai'
            } else {
                console.warn(`[Roast] AI failed for ${username}, using rules`)
                roast = generateRoast(data)
            }
        } else {
            roast = generateRoast(data)
        }

        // WHY: safety net — roast should never be empty
        if (!roast || roast.trim().length === 0) {
            roast = `@${username}'s GitHub exists. That's the nicest thing the data supports.`
        }

        data.roast = roast
        data.roastSource = roastSource

        // ── Save roast to MongoDB ─────────────────────────
        // WHY separate try/catch: DB save should NEVER block
        //     the response — user gets roast regardless
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
                isPro,
            })
            data.roastId = savedRoast._id
        } catch (dbErr) {
            console.error('[Roast] DB save failed:', dbErr.message)
        }

        // ── Update user roast count ───────────────────────
        if (req.user) {
            req.user.roastCount += 1
            req.user.lastRoastDate = new Date()
            await req.user.save().catch(e =>
                console.error('[Roast] User save failed:', e.message)
            )
        }

        const responseData = { success: true, data }

        // ── Cache response against idempotency key ────────
        // WHY: store so duplicate request returns same response
        if (idempotencyKey) {
            processedKeys.set(idempotencyKey, {
                response: responseData,
                time: Date.now(),
            })
        }

        return res.status(200).json(responseData)

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
// WHY: dedicated Pro endpoint — always uses AI roast
router.get('/:username/pro', requirePro, async (req, res) => {
    const { username } = req.params

    if (
        !username ||
        username.length > 39 ||
        !/^[a-zA-Z0-9-]+$/.test(username)
    ) {
        return res.status(400).json({
            error: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format.',
        })
    }

    try {
        const data = await analyzeProfile(username, req.user.githubAccessToken)
        const roast = await generateAIRoast(data) || generateRoast(data)

        data.roast = roast
        data.roastSource = 'ai'

        return res.status(200).json({ success: true, data })

    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                error: 'USER_NOT_FOUND',
                message: `"@${username}" not found on GitHub.`,
            })
        }
        console.error(`[ProRoast] Error for ${username}:`, err.message)
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Something went wrong.',
        })
    }
})

module.exports = router