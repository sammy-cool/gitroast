// ============================================================
// GITROAST — AI Roast Service (Google Gemini)
// WHY Gemini: 100% free, no credit card, 250 req/day
//             zero cost for Pro roasts at launch scale
// WHY fallback: if Gemini fails → rule engine kicks in
//               roast request NEVER crashes
// ============================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// ─── Build the roast prompt ───────────────────────────────
// WHY separate: easiest thing to tune independently
function buildRoastPrompt(data) {
  const {
    username,
    score,
    grade,
    joinYear,
    totalRepos,
    _raw,
    repoAnalysis,
    commitAnalysis,
    readme,
  } = data

  return `You are GitRoast, a savage but funny code roast generator.
Your job: write a short, brutal, hilarious roast of a developer's GitHub profile.

RULES:
- Funny not mean. Roast the CODE not the person.
- Exactly 2-3 sentences. Punchy. No fluff.
- Reference specific data points — make it personal.
- Never say "I" or refer to yourself.
- Never be generic — every roast must feel unique.
- End with a mic-drop closer.
- Tone: roast comedy show — brutal but crowd is laughing WITH the dev.

DEVELOPER DATA:
Username:         @${username}
Roast Score:      ${score}/100 (Grade: ${grade})
Member Since:     ${joinYear}
Total Repos:      ${totalRepos}
Top Language:     ${_raw?.topLanguage || 'Unknown'}
All Languages:    ${_raw?.languages?.slice(0, 4).join(', ') || 'Unknown'}
Abandoned Repos:  ${repoAnalysis?.abandonedCount ?? 0} of ${repoAnalysis?.totalOwn ?? 0}
Abandonment Rate: ${repoAnalysis?.abandonedPct ?? 0}%
Commit Quality:   ${commitAnalysis?.qualityScore ?? 0}%
README Status:    ${readme?.exists ? (readme.isEmpty ? 'Exists but basically empty' : 'Has real content') : 'Does not exist'}
Shame Commits:    ${commitAnalysis?.shameList?.slice(0, 3).join(' | ') || 'None found'}
Total Stars:      ${_raw?.totalStars ?? 0}

Write ONLY the roast not facts you have to roast in funny way. No quotes. No preamble. No explanation. And Must create smile on anyone face whenever someone's read it!`
}

// ─── generateClaudeRoast ─────────────────────────────────────
// WHY returns string | null:
//   null = caller uses rule engine fallback silently
async function generateClaudeRoast(data) {

  // WHY: never crash if key is missing — just fall back
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AI] No Gemini API key — using rule engine')
    return null
  }

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildRoastPrompt(data) }],
            },
          ],
          generationConfig: {
            // WHY 200 tokens: roast = 2-3 punchy sentences max
            // maxOutputTokens: 200,
            temperature:     0.9,   // WHY 0.9: creative but not unhinged
            topP:            0.95,
          },
        }),
        // WHY 10s timeout: don't hang the request if Gemini is slow
        // signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('[AI] Gemini API error:', response.status, err?.error?.message)
      return null
    }

    const json  = await response.json()

    // WHY: Gemini response shape is different from OpenAI
    //      text lives at candidates[0].content.parts[0].text
    const roast = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!roast || roast.length < 20) {
      console.warn('[AI] Empty or too-short Gemini response')
      return null
    }

    return roast

  } catch (err) {
    // WHY catch-all: timeout, network error, JSON parse error
    //     none of these should ever crash a roast request
    console.error('[AI] Gemini request failed:', err.message)
    return null
  }
}

module.exports = { generateClaudeRoast }