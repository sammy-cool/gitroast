// WHERE: server/services/battleService.js

const { analyzeProfile } = require("./githubService");
const { generateRoast } = require("./roastEngine");
const { generateAIRoast } = require("./aiService");
const { logger } = require("../utils/logger");

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
            // maxOutputTokens: 300,
            temperature: 1.1,
            topP: 0.95,
          },
        }),
        signal: AbortSignal.timeout(50000),
      },
    );

    if (!res.ok) return null;

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
    // WHY: include stats for potential future use
    stats1: data1.stats,
    stats2: data2.stats,
  };
}

module.exports = { runBattle };
