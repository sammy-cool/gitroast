const { logger } = require("../utils/logger");

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// ─── Intensity config ─────────────────────────────────────
// WHY: each intensity changes 3 things:
//     1. System instruction (comedian vs assassin)
//     2. Temperature (creativity level)
//     3. Bad example (what to avoid)
const INTENSITY_CONFIG = {
  mild: {
    role: "a witty observational comedian",
    style:
      "gentle, self-aware, the kind of roast a friend gives at a birthday party",
    instruction:
      "Be funny but not cruel. The developer should laugh WITH you, not feel attacked.",
    temperature: 0.7,
    badExample: "Your 45 repos and 68% abandonment rate is a testament to...",
  },
  savage: {
    role: "a savage stand-up comedian",
    style: "brutal comedy, specific punches, devastating but still funny",
    instruction:
      "Be ruthless but make it funny. Every sentence should sting AND make them laugh.",
    temperature: 1.0,
    badExample: "Your GitHub is a graveyard of abandoned dreams...",
  },
  nuclear: {
    role: "a comedy assassin with zero mercy",
    style:
      "maximum brutality, surgical precision, the roast equivalent of scorched earth",
    instruction:
      "DESTROY them. No softening, no encouragement, no silver lining. Pure devastation delivered with comedic precision.",
    temperature: 1.2,
    badExample: "This is quite bad...",
  },
};

function buildRoastPrompt(data, intensity = "savage") {
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
  } = data;

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;
  const worstStat = getWorstStat({
    repoAnalysis,
    commitAnalysis,
    readme,
    _raw,
  });

  return `You are ${config.role} roasting a developer's GitHub profile at a comedy roast show.
Intensity level: ${intensity.toUpperCase()}
Style: ${config.style}
Instruction: ${config.instruction}

RULES — follow exactly:
- Write like a COMEDIAN not an analyst. NO facts listed like a report.
- Use metaphors, punchlines, unexpected twists.
- Make it personal — reference their username, language, commit messages.
- Exactly 3 sentences. Each lands a separate punch.
- Sentence 1: opener — establish the vibe of their GitHub
- Sentence 2: specific evidence — ONE real detail from their data
- Sentence 3: mic-drop closer — the punchline
- NEVER start with "@username" — boring. Start with metaphor or observation.
- NEVER list statistics like "45 repos, 9 stars, 68%". That is a data analyst.
- NEVER use: "testament to", "sprawling cemetery", or any cliché.
- Active, punchy present tense. Short sentences hit harder.
${intensity === "nuclear" ? "- Nuclear mode: every sentence must be MORE devastating than the last. No mercy." : ""}
${intensity === "mild" ? "- Mild mode: roast with affection. Mean it kindly." : ""}

THEIR DATA:
Username:         @${username}
GitHub since:     ${joinYear} (${new Date().getFullYear() - joinYear} years)
Total repos:      ${totalRepos}
Top language:     ${_raw?.topLanguage || "unknown"}
Abandoned repos:  ${repoAnalysis?.abandonedCount ?? 0} of ${repoAnalysis?.totalOwn ?? 0}
Commit quality:   ${commitAnalysis?.qualityScore ?? 0}%
Worst commits:    ${commitAnalysis?.shameList?.slice(0, 2).join(" and ") || "none"}
README:           ${readme?.exists ? (readme.isEmpty ? "exists but empty" : "has content") : "missing"}
Total stars:      ${_raw?.totalStars ?? 0}
Score:            ${score}/100 (Grade: ${grade})

FOCUS YOUR ROAST ON THIS ANGLE:
${worstStat}

BAD EXAMPLE (never write like this):
"${config.badExample}"

Write ONLY the 3-sentence roast. No quotes. No intro. No explanation. Just the roast.`;
}

function getWorstStat({ repoAnalysis, commitAnalysis, readme, _raw }) {
  const angles = [];

  if ((repoAnalysis?.abandonedPct ?? 0) > 60) {
    angles.push(
      `ABANDONMENT: ${repoAnalysis.abandonedPct}% repos abandoned. ` +
        `Joke about starting things and never finishing.`,
    );
  }
  if ((commitAnalysis?.qualityScore ?? 100) < 30) {
    const sample = commitAnalysis?.shameList?.[0] || "pls work";
    angles.push(
      `COMMIT MESSAGES: ${commitAnalysis.qualityScore}% quality. ` +
        `They wrote "${sample}". Joke about commit messages as a cry for help.`,
    );
  }
  if (!readme?.exists) {
    angles.push(
      `NO README: Top repo has zero docs. ` +
        `Joke about code nobody can understand including the author.`,
    );
  }
  if ((_raw?.totalStars ?? 0) < 5 && (repoAnalysis?.totalOwn ?? 0) > 10) {
    angles.push(
      `ZERO RECOGNITION: ${repoAnalysis.totalOwn} repos, ${_raw.totalStars} stars. ` +
        `The internet collectively decided to look away.`,
    );
  }
  if (angles.length === 0) {
    angles.push(
      `MEDIOCRITY: Nothing catastrophically bad, nothing good. ` +
        `Joke about being persistently, professionally average.`,
    );
  }

  return angles[0];
}

async function generateAIRoast(data, intensity = "savage") {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("AI", "No Gemini API key — using rule engine");
    return null;
  }

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildRoastPrompt(data, intensity) }] }],
          generationConfig: {
            // maxOutputTokens: 250,
            temperature: config.temperature,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(50000), // WHY 50s ai took some time to respond: if Gemini doesn't respond in 50s, fall back to rule engine instantly
      },
    );

    if (!response.ok) {
      logger.error("AI", "Gemini API error", { status: response.status });
      return null;
    }

    const json = await response.json();
    const roast = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!roast || roast.length < 20) return null;

    return roast.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    logger.error("AI", "Gemini request failed", { message: err.message });
    return null;
  }
}

// ── generateAIRoastStream ─────────────────────────────────────
// ── WHAT: Asynchronous generator that yields real-time roast tokens using Gemini SSE streaming.
// ── WHY: Eliminates perceived waiting latency; streams tokens live to Server-Sent Events client.
// ── WHERE & WHEN TO USE: In /api/roast/:username/stream endpoint.
// ── USE CASES: Real-time live AI typing animation on roast results.
// ── WHEN NOT TO USE: In batch jobs or image certificate generators.
async function* generateAIRoastStream(data, intensity = "savage") {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("AI", "No Gemini API key for stream — fallback requested");
    return;
  }

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;
  const STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildRoastPrompt(data, intensity) }] }],
        generationConfig: {
          temperature: config.temperature,
          topP: 0.95,
          topK: 40,
        },
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!response.ok) {
      logger.error("AI", "Gemini streaming error", { status: response.status });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete trailing fragment

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch {
            // Ignore non-json SSE lines
          }
        }
      }
    }
  } catch (err) {
    logger.error("AI", "Gemini stream error", { message: err.message });
  }
}

module.exports = { generateAIRoast, generateAIRoastStream };
