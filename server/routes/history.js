const express = require('express')
const router = express.Router()
const Roast = require('../models/Roast')
const { optionalAuth } = require('../middleware/auth')

// ─── GET /api/history/:username ───────────────────────────
// WHY: shows past roasts for any username
//      public endpoint — no login needed
router.get('/:username', async (req, res) => {
    const { username } = req.params

    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
        return res.status(400).json({
            error: 'INVALID_USERNAME',
            message: 'Invalid GitHub username.',
        })
    }

    try {
        const history = await Roast.getHistory(username, 10)

        return res.status(200).json({
            success: true,
            username,
            count: history.length,
            history,
        })
    } catch (err) {
        console.error('[History] Error:', err.message)
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Could not fetch history.',
        })
    }
})

// ─── GET /api/history/leaderboard/worst ───────────────────
// WHY: shows the most roasted profiles globally
//      viral feature — people compete for worst score
router.get('/leaderboard/worst', async (req, res) => {
    try {
        const leaderboard = await Roast.getLeaderboard(10)

        return res.status(200).json({
            success: true,
            leaderboard,
        })
    } catch (err) {
        console.error('[Leaderboard] Error:', err.message)
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Could not fetch leaderboard.',
        })
    }
})

// ─── POST /api/history/:id/share ──────────────────────────
// WHY: track how many times a roast is shared
//      powers viral metrics dashboard later
router.post('/:id/share', async (req, res) => {
    try {
        await Roast.incrementShare(req.params.id)
        return res.status(200).json({ success: true })
    } catch (err) {
        // WHY: share tracking failure should never block the user
        return res.status(200).json({ success: true })
    }
})

module.exports = router