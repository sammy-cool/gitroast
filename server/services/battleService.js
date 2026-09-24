// WHERE: server/services/battleService.js

const { analyzeProfile } = require("./githubService");
const { generateRoast } = require("./roastEngine");
const { generateAIRoast, GEMINI_MODEL } = require("./aiService");
const { logger } = require("../utils/logger");

// ── Gemini Battle Model Configuration ─────────────────────────
// ── WHAT: ────────────────────────────────────────────────────
// Dynamically configured Gemini model endpoint for the boxing announcer verdict.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Ensures the battle announcer AI model stays 100% consistent with the profile roast model.
// 2. Honors user model overrides via the GEMINI_MODEL environment variable without code changes.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Invoked when synthesizing comparative boxing verdicts in /api/battle/:user1/vs/:user2.
//
// ── USE CASES: ───────────────────────────────────────────────
// Comparative roast generation between two rival GitHub accounts.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not use if either profile fails validation or when running in offline/unkeyed environments.
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── generateBattleRoast ──────────────────────────────────
// WHY: AI generates a battle verdict comparing BOTH profiles
//      not just two separate roasts — a comparative roast
async function generateBattleRoast(data1, data2) {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `You are a boxing announcer who is also a savage comedian.
Two developers are in a roast battle. Announce the winner with maximum drama.

PLAYER 1: @${data1.username}
  Score: ${data1.score}/100 (Grade: ${data1.grade})
  Language: ${data1._raw?.topLanguage || "unknown"}
  Abandoned repos: ${data1.repoAnalysis?.abandonedCount ?? 0}
  Total stars: ${data1._raw?.totalStars ?? 0}

PLAYER 2: @${data2.username}
  Score: ${data2.score}/100 (Grade: ${data2.grade})
  Language: ${data2._raw?.topLanguage || "unknown"}
  Abandoned repos: ${data2.repoAnalysis?.abandonedCount ?? 0}
  Total stars: ${data2._raw?.totalStars ?? 0}

RULES:
- Lower score = more roastable = WINS the shame crown
- Write 2 sentences ONLY
- Sentence 1: compare them directly with a specific savage observation
- Sentence 2: declare the winner of shame with a punchline
- Make it sound like a boxing ring announcement but funnier
- Reference their actual usernames and stats
- NEVER list numbers like "45 repos, 9 stars"

No quotes. No intro.`;

  try {
    const res = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 1.1,
            topP: 0.95,
          },
        }),
        signal: AbortSignal.timeout(10000), // WHY 10s: avoids 50s hangs on Gemini outages — rule verdict is instant fallback
      },
    );

    if (!res.ok) {
      logger.error("AI", "Gemini battle API error", { status: res.status, model: GEMINI_MODEL });
      if (res.status === 404 && GEMINI_MODEL !== "gemini-2.5-flash") {
        logger.warn("AI", `Battle model ${GEMINI_MODEL} returned 404, falling back to gemini-2.5-flash`);
        try {
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  maxOutputTokens: 150,
                  temperature: 1.1,
                  topP: 0.95,
                },
              }),
              signal: AbortSignal.timeout(10000),
            },
          );
          if (fallbackRes.ok) {
            const fbJson = await fallbackRes.json();
            const fbRoast = fbJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (fbRoast && fbRoast.length > 20) {
              return fbRoast.replace(/^["']|["']$/g, "").trim();
            }
          }
        } catch (fbErr) {
          logger.error("Battle", "AI verdict fallback failed", { message: fbErr.message });
        }
      }
      return null;
    }

    const json = await res.json();
    const roast = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return roast?.replace(/^["']|["']$/g, "").trim() || null;
  } catch (err) {
    logger.error("Battle", "AI verdict failed", { message: err.message });
    return null;
  }
}

// ─── runBattle ────────────────────────────────────────────
async function runBattle(username1, username2, token1 = null) {
  // WHY: fetch both profiles in parallel — faster
  const [data1, data2] = await Promise.all([
    analyzeProfile(username1, token1),
    analyzeProfile(username2, token1),
  ]);

  // WHY savage intensity for battles — battles should be brutal
  const roast1 = generateRoast(data1, "savage");
  const roast2 = generateRoast(data2, "savage");

  // WHY: lower score = more roastable = winner of shame
  let winner = null;
  let loser = null;
  if (data1.score < data2.score) {
    winner = username1;
    loser = username2;
  } else if (data2.score < data1.score) {
    winner = username2;
    loser = username1;
  }
  // WHY: if equal scores → draw (winner stays null)

  // AI battle verdict
  const battleRoast =
    (await generateBattleRoast(data1, data2)) ||
    `In a battle of GitHub shame, @${winner || "neither"} wins — and by wins, we mean loses worse.`;

  return {
    user1: username1,
    user2: username2,
    score1: data1.score,
    score2: data2.score,
    grade1: data1.grade,
    grade2: data2.grade,
    winner,
    loser,
    roast1,
    roast2,
    battleRoast,
    stats1: {
      totalRepos: data1.totalRepos ?? data1.stats?.totalRepos ?? 0,
      abandonedRepos: data1.repoAnalysis?.abandonedCount ?? 0,
      totalStars: data1._raw?.totalStars ?? 0,
      topLanguage: data1.repoAnalysis?.topLanguage || "Nothing",
      commitQuality: data1.commitAnalysis?.qualityScore ?? 0,
      joinYear: data1.joinYear ?? 2020,
    },
    stats2: {
      totalRepos: data2.totalRepos ?? data2.stats?.totalRepos ?? 0,
      abandonedRepos: data2.repoAnalysis?.abandonedCount ?? 0,
      totalStars: data2._raw?.totalStars ?? 0,
      topLanguage: data2.repoAnalysis?.topLanguage || "Nothing",
      commitQuality: data2.commitAnalysis?.qualityScore ?? 0,
      joinYear: data2.joinYear ?? 2020,
    },
  };
}

module.exports = { runBattle };
