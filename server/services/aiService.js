// ============================================================
// GITROAST — Gemini AI Roast Service
// WHY: Pro users get AI-powered roasts via Google Gemini
//      Free tier: 250 req/day, zero credit card needed
// ============================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// ─── buildRoastPrompt ────────────────────────────────────
// WHY separate function: easiest part to tune independently
//     the prompt IS the product for this feature
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

  // WHY: pick a savage angle based on their worst stat
  //      gives AI a specific comedic direction to aim at
  const worstStat = getWorstStat({ repoAnalysis, commitAnalysis, readme, _raw })

  return `You are a savage stand-up comedian roasting a developer's GitHub profile at a comedy roast show.
The audience is other developers. They want to laugh OUT LOUD.

STYLE RULES — follow these exactly:
- Write like a COMEDIAN not an analyst. NO facts listed like a report.
- Use metaphors, punchlines, callbacks, unexpected twists.
- Make it PERSONAL to this specific profile — reference their actual username, language, commit messages.
- Funny > brutal. The roast should make the developer laugh at themselves.
- Exactly 3 sentences. Each sentence lands a separate punch.
- Sentence 1: savage opener — establish the vibe of their GitHub
- Sentence 2: specific evidence — use ONE real detail from their data
- Sentence 3: mic-drop closer — the punchline that ties it together
- NEVER start with "@username" — that's boring. Start with a metaphor or observation.
- NEVER list statistics like "45 repos, 9 stars, 68%". That's a data analyst, not a comedian.
- NEVER use the phrase "testament to" or "sprawling cemetery" or any cliché.
- Write in active, punchy present tense. Short sentences hit harder.

THEIR DATA (use this as inspiration, NOT as a list to recite):
Username:         @${username}
GitHub since:     ${joinYear} (${new Date().getFullYear() - joinYear} years of this)
Total repos:      ${totalRepos}
Top language:     ${_raw?.topLanguage || 'unknown'}
Abandoned repos:  ${repoAnalysis?.abandonedCount ?? 0} out of ${repoAnalysis?.totalOwn ?? 0}
Commit quality:   ${commitAnalysis?.qualityScore ?? 0}% (lower = more shameful messages)
Worst commits:    ${commitAnalysis?.shameList?.slice(0, 2).join(' and ') || 'none found'}
README:           ${readme?.exists ? (readme.isEmpty ? 'exists but basically empty' : 'actually has content') : 'completely missing'}
Total stars:      ${_raw?.totalStars ?? 0}
Roast score:      ${score}/100 (Grade: ${grade})

THEIR WORST ANGLE (focus your roast HERE):
${worstStat}

EXAMPLES OF GOOD ROAST STYLE (never copy these, just match the energy):
- "Calling this a portfolio is generous — it's more of a support group for unfinished ideas that never made it to version 0.2."
- "The commit history reads like a person who discovered programming, got excited, committed 'initial setup', and then discovered Netflix."
- "In ${new Date().getFullYear() - parseInt(joinYear) || 3} years of coding, the most consistent thing about this GitHub is how consistently nothing ships."

BAD STYLE (never do this):
- "With 52 repos and only 9 stars, your 68% abandonment rate is a testament to..." ← data report, not comedy
- "@sammy-cool, your GitHub is a graveyard of..." ← cliché opener
- "Your commit messages show that..." ← too analytical

Write ONLY the 3-sentence roast. No quotes around it. No intro. No explanation. Just the roast.`
}

// ─── getWorstStat ────────────────────────────────────────
// WHY: gives AI a specific angle to attack
//      roasts with a clear target are funnier than vague ones
function getWorstStat({ repoAnalysis, commitAnalysis, readme, _raw }) {
  const angles = []

  if ((repoAnalysis?.abandonedPct ?? 0) > 60) {
    angles.push(
      `ABANDONMENT: They abandon ${repoAnalysis.abandonedPct}% of their repos. ` +
      `Most die after the first commit. Make jokes about starting things and never finishing.`
    )
  }

  if ((commitAnalysis?.qualityScore ?? 100) < 30) {
    const sample = commitAnalysis?.shameList?.[0] || 'pls work'
    angles.push(
      `COMMIT MESSAGES: Only ${commitAnalysis.qualityScore}% quality score. ` +
      `They write things like "${sample}". Make jokes about their commit messages being ` +
      `more like diary entries from someone having a breakdown.`
    )
  }

  if (!readme?.exists) {
    angles.push(
      `NO README: Their top repo has zero documentation. ` +
      `Make jokes about code existing that no human can understand, including the author.`
    )
  }

  if ((_raw?.totalStars ?? 0) < 5 && (repoAnalysis?.totalOwn ?? 0) > 10) {
    angles.push(
      `ZERO RECOGNITION: ${repoAnalysis.totalOwn} repos, ${_raw.totalStars} total stars. ` +
      `The internet has collectively decided to look away. Make jokes about ` +
      `building in public but nobody showing up.`
    )
  }

  if (_raw?.topLanguage === 'PHP') {
    angles.push(
      `PHP IN ${new Date().getFullYear()}: Still writing PHP. ` +
      `Make jokes about this being a lifestyle choice nobody asked for.`
    )
  }

  if (_raw?.topLanguage === 'JavaScript' && (repoAnalysis?.abandonedPct ?? 0) > 40) {
    angles.push(
      `JAVASCRIPT GRAVEYARD: JavaScript repos everywhere, most abandoned. ` +
      `Make jokes about the npm install to project death pipeline.`
    )
  }

  // WHY: if no clear worst stat, attack the overall mediocrity
  if (angles.length === 0) {
    angles.push(
      `MEDIOCRITY: Nothing is catastrophically bad, nothing is good. ` +
      `Make jokes about being comfortably, professionally, persistently average. ` +
      `The most roastable thing here is how thoroughly unremarkable it all is.`
    )
  }

  // WHY: pick the most roastable angle
  return angles[0]
}

// ─── generateAIRoast ─────────────────────────────────────
// WHY returns string | null:
//   null = caller uses rule engine fallback silently
async function generateAIRoast(data) {

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AI] No Gemini API key — using rule engine')
    return null
  }

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildRoastPrompt(data) }],
            },
          ],
          generationConfig: {
            // maxOutputTokens: 250,  // WHY 250: 3 punchy sentences, no more
            temperature: 1.0,  // WHY 1.0: maximum creativity for comedy
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('[AI] Gemini API error:', response.status, err?.error?.message)
      return null
    }

    const json = await response.json()
    const roast = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!roast || roast.length < 20) {
      console.warn('[AI] Empty or too-short Gemini response')
      return null
    }

    // WHY: strip any accidental surrounding quotes Gemini sometimes adds
    return roast.replace(/^["']|["']$/g, '').trim()

  } catch (err) {
    console.error('[AI] Gemini request failed:', err.message)
    return null
  }
}

module.exports = { generateAIRoast }