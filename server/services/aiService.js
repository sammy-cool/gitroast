const { logger } = require("../utils/logger");

function resolveGeminiModel(rawModel) {
  const model = (rawModel || "").trim();
  if (!model) return "gemini-2.5-flash";
  if (model === "gemini-3.1-pro") return "gemini-3.1-pro-preview";
  if (model === "gemini-3.1-flash") return "gemini-3.1-flash-lite-preview";
  return model;
}

const RAW_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MODEL = resolveGeminiModel(RAW_GEMINI_MODEL);

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

const PERSONA_CONFIG = {
  staff_engineer: {
    name: "Staff Engineer",
    roleModifier: "a dry, precise staff engineer doing a loving but unsparing design review of a developer's public work",
    languageInstruction: "Write in English. Be specific: cite real numbers, repository names and patterns from the data.",
    styleGuide: "Dry, evidence-first wit. Every joke points at a concrete public signal and ends with a useful next step.",
    badExample: "Your GitHub is a sprawling cemetery of unfinished side projects...",
  },
  chaos_intern: {
    name: "Chaos Intern",
    roleModifier: "a hyperactive, chronically online intern who has read every commit and has zero filter",
    languageInstruction: "Write in fast, feral, meme-literate English. Short punchy sentences. Never target identity or appearance; only code, commits and habits.",
    styleGuide: "Chaotic energy, rapid-fire observations, affectionate mockery grounded in the data.",
    badExample: "lol your repos are kinda bad...",
  },
  historian: {
    name: "Historian",
    roleModifier: "a patient archivist narrating a developer's public history as if documenting an ancient civilisation",
    languageInstruction: "Write in English with a long-memory, documentary tone. Compare past and present patterns in the data (trends, abandoned repos, documentation habits).",
    styleGuide: "Deadpan chronicler. Treats commit history as archaeology; jokes come from long-term patterns.",
    badExample: "In the beginning there were repositories, and they were abandoned...",
  },
  classic: {
    name: "Classic Savage",
    roleModifier: "a sharp, cynical senior software architect with biting dark wit",
    languageInstruction: "Write in English.",
    styleGuide: "Dry tech wit, devastating punchlines, brutally honest code review.",
    badExample: "Your GitHub is a sprawling cemetery of unfinished side projects...",
  },
  hinglish: {
    name: "Desi Tech Lead",
    roleModifier: "a deeply disappointed, sarcastic Indian Senior Engineering Manager (Desi Tech Lead)",
    languageInstruction: "Write in authentic, natural Hinglish (Hindi + English mix written in Roman script). Use relatable Indian developer slang naturally like 'bhai', 'jugaad', 'production fat gaya', 'onsite ka sapna', 'LinkedIn influencer', 'kya kar raha hai yaar', 'salary credit hoti hai bas'.",
    styleGuide: "Authentic Indian tech office comedy. Highly relatable, stinging with frustration and comedic despair.",
    badExample: "Bhai your code is very bad and you have no stars...",
  },
  techbro: {
    name: "Silicon Valley Tech Bro",
    roleModifier: "a hyperactive, VC-funded Silicon Valley Web3 & AI startup founder who talks exclusively in buzzwords",
    languageInstruction: "Write in English drenched in Silicon Valley tech bro lingo: 'not 10x', 'zero alpha', 'negative conviction', 'pivot to autonomous agent swarms', 'touch grass king', 'Web2 CRUD', 'burn rate', 'seed round', 'skill issue'.",
    styleGuide: "Smug, fast-talking, AI-maximalist founder energy. Treats everything as an investment thesis failure.",
    badExample: "Your repos don't have enough stars to raise venture capital...",
  },
  ramsay: {
    name: "Gordon Ramsay of Code",
    roleModifier: "Chef Gordon Ramsay doing a Kitchen Nightmares style inspection of a catastrophic GitHub profile",
    languageInstruction: "Write in furious, screaming Gordon Ramsay style: ALL CAPS outbursts, 'IT'S RAW!', 'idiot sandwich', 'disaster', 'shut it down', 'embarrassing', 'dreadful'.",
    styleGuide: "Explosive culinary fury applied to software engineering. High energy and pure shock.",
    badExample: "This code is not cooked properly and looks quite bad...",
  },
  shakespearean: {
    name: "Shakespearean Tragedy",
    roleModifier: "William Shakespeare observing an Elizabethan tragedy of catastrophic commits and cursed logic",
    languageInstruction: "Write in theatrical Early Modern / Elizabethan English: 'thou', 'thee', 'thy', 'doth', 'hath', 'wherefore', 'alas', 'foul specter'.",
    styleGuide: "Dramatic tragic poetry, eloquent sorrow, mock-heroic tragedy of modern JavaScript.",
    badExample: "Thou hast 40 repositories and very few stars...",
  },
};

function buildRoastPrompt(data, intensity = "savage", persona = "classic") {
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
  const personaConfig = PERSONA_CONFIG[persona] || PERSONA_CONFIG.staff_engineer;
  const worstStat = getWorstStat({
    repoAnalysis,
    commitAnalysis,
    readme,
    _raw,
  });

  return `You are ${personaConfig.roleModifier} acting as ${config.role} roasting a developer's GitHub profile at a comedy roast show.
Persona Style: ${personaConfig.name}
${personaConfig.languageInstruction}
Intensity level: ${intensity.toUpperCase()}
Style: ${config.style} — ${personaConfig.styleGuide}
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
"${personaConfig.badExample || config.badExample}"

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

function buildRepoRoastPrompt(data, intensity = "savage") {
  const {
    fullName,
    repoName,
    language,
    stars,
    forks,
    openIssues,
    score,
    grade,
    commitQuality,
    codeSmells = [],
    shameCommits = [],
    description,
    monthsInactive = 0,
    hasTests,
  } = data;

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;

  return `You are a cynical Staff Principal Software Architect and savage comedian doing a code review of a GitHub repository.
Intensity level: ${intensity.toUpperCase()}
Style: ${config.style}
Instruction: Roast the architecture, commit discipline, and coding life choices of this project.

RULES:
- Exactly 3 sentences. No bullet points, no markdown headers.
- Sentence 1: opener — evaluate the architectural ambition vs reality of the project.
- Sentence 2: specific roast — target their actual commit habits, missing tests, or code smells.
- Sentence 3: closer — deliver the ultimate comedic punchline about using this code in production.
- Make it personal to the tech stack (${language || "code"}) and repository name (${repoName || "project"}).
- NEVER start with "This repository" or "Welcome to". Start immediately with the punch.
- No intro, no quotes, no explanation. Just the 3-sentence review.

REPOSITORY SPECS:
Project: @${fullName} (${description || "no description provided"})
Primary Language: ${language || "Unknown"}
Stars: ${stars} | Forks: ${forks} | Open Issues Backlog: ${openIssues}
Repo Health Score: ${score}/100 (Grade: ${grade})
Commit Message Quality: ${commitQuality}%
Automated Tests: ${hasTests ? "Present" : "ZERO automated tests detected"}
Inactivity: ${monthsInactive > 0 ? `${monthsInactive} months since last commit` : "actively maintained chaos"}
Flagged Smells: ${codeSmells.slice(0, 3).join("; ") || "untested architectural chaos"}
Sample Commit Messages: ${shameCommits.slice(0, 3).map((m) => `"${m}"`).join(", ") || "none"}

Write ONLY the 3-sentence architectural roast:`;
}

async function generateAIRoast(data, intensity = "savage", persona = "classic") {
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
          contents: [{ parts: [{ text: buildRoastPrompt(data, intensity, persona) }] }],
          generationConfig: {
            temperature: config.temperature,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(50000),
      },
    );

    if (!response.ok) {
      logger.error("AI", "Gemini API error", { status: response.status, model: GEMINI_MODEL });
      if (response.status === 404 && GEMINI_MODEL !== "gemini-2.5-flash") {
        logger.warn("AI", `Model ${GEMINI_MODEL} returned 404, falling back to gemini-2.5-flash`);
        try {
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: buildRoastPrompt(data, intensity, persona) }] }],
                generationConfig: {
                  temperature: config.temperature,
                  topP: 0.95,
                  topK: 40,
                },
              }),
              signal: AbortSignal.timeout(50000),
            },
          );
          if (fallbackRes.ok) {
            const fbJson = await fallbackRes.json();
            const fbRoast = fbJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (fbRoast && fbRoast.length >= 20) {
              return fbRoast.replace(/^["']|["']$/g, "").trim();
            }
          }
        } catch (fbErr) {
          logger.error("AI", "Gemini fallback request failed", { message: fbErr.message });
        }
      }
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

async function* generateAIRoastStream(data, intensity = "savage", persona = "classic") {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("AI", "No Gemini API key for stream — fallback requested");
    return;
  }

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;
  const STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildRoastPrompt(data, intensity, persona) }] }],
        generationConfig: {
          temperature: config.temperature,
          topP: 0.95,
          topK: 40,
        },
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!response.ok) {
      logger.error("AI", "Gemini streaming error", { status: response.status, model: GEMINI_MODEL });
      if (response.status === 404 && GEMINI_MODEL !== "gemini-2.5-flash") {
        logger.warn("AI", `Streaming model ${GEMINI_MODEL} returned 404, falling back to gemini-2.5-flash`);
        const fallbackStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
        try {
          const fallbackRes = await fetch(fallbackStreamUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: buildRoastPrompt(data, intensity, persona) }] }],
              generationConfig: {
                temperature: config.temperature,
                topP: 0.95,
                topK: 40,
              },
            }),
            signal: AbortSignal.timeout(50000),
          });
          if (fallbackRes.ok) {
            const fallbackReader = fallbackRes.body.getReader();
            const fallbackDecoder = new TextDecoder();
            let fbBuffer = "";
            try {
              while (true) {
                const { done, value } = await fallbackReader.read();
                if (done) break;
                fbBuffer += fallbackDecoder.decode(value, { stream: true });
                const lines = fbBuffer.split("\n");
                fbBuffer = lines.pop();
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const parsed = JSON.parse(line.slice(6));
                      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) yield text;
                    } catch {}
                  }
                }
              }
              if (fbBuffer && fbBuffer.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(fbBuffer.slice(6));
                  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) yield text;
                } catch {}
              }
            } finally {
              fallbackReader.releaseLock();
            }
            return;
          }
        } catch (fbErr) {
          logger.error("AI", "Gemini stream fallback failed", { message: fbErr.message });
        }
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) yield text;
            } catch {
            }
          }
        }
      }

      if (buffer && buffer.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(buffer.slice(6));
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err) {
    logger.error("AI", "Gemini stream error", { message: err.message });
  }
}

async function generateAIRepoRoast(data, intensity = "savage") {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("AI", "No Gemini API key for repo roast — using rule engine");
    return null;
  }

  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.savage;
  const prompt = buildRepoRoastPrompt(data, intensity);

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: config.temperature,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(50000),
      }
    );

    if (!response.ok) {
      logger.error("AI", "Gemini repo roast error", { status: response.status, model: GEMINI_MODEL });
      if (response.status === 404 && GEMINI_MODEL !== "gemini-2.5-flash") {
        logger.warn("AI", `Repo roast model ${GEMINI_MODEL} returned 404, falling back to gemini-2.5-flash`);
        try {
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: config.temperature,
                  topP: 0.95,
                  topK: 40,
                },
              }),
              signal: AbortSignal.timeout(50000),
            }
          );
          if (fallbackRes.ok) {
            const fbJson = await fallbackRes.json();
            const fbRoast = fbJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (fbRoast && fbRoast.length >= 20) {
              return fbRoast.replace(/^["']|["']$/g, "").trim();
            }
          }
        } catch (fbErr) {
          logger.error("AI", "Gemini repo fallback failed", { message: fbErr.message });
        }
      }
      return null;
    }

    const json = await response.json();
    const roast = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!roast || roast.length < 20) return null;
    return roast.replace(/^["']|["']$/g, "").trim();
  } catch (err) {
    logger.error("AI", "Gemini repo request failed", { message: err.message });
    return null;
  }
}

async function generateAIRedemptionPlan(data) {
  const isRepo = !!data?.fullName;
  const username = data?.username || data?.fullName || "developer";
  const { repoAnalysis, commitAnalysis, readme, _raw, totalRepos } = data || {};

  if (process.env.GEMINI_API_KEY) {
    const prompt = isRepo
      ? `You are a Senior Principal Software Architect and code mentor who is also funny.
Review this GitHub repository's architecture and flaws and give exactly 3 funny, blunt, but GENUINELY actionable steps to redeem this codebase.

REPOSITORY DATA:
Project: @${data.fullName}
Language: ${data.language || "code"}
Stars: ${data.stars || 0} | Open Issues: ${data.openIssues || 0}
Automated Tests: ${data.hasTests ? "Present" : "ZERO tests"}
Commit Message Quality: ${data.commitQuality || 0}%
Flagged Smells: ${(data.codeSmells || []).slice(0, 3).join("; ") || "untested chaos"}

RULES:
- Return a JSON array of strings containing EXACTLY 3 items: ["Tip 1", "Tip 2", "Tip 3"].
- Each tip should be 1-2 punchy sentences.
- Make it sound like tough love: humorous, specific, and actually helpful.
- No markdown, no intro, no code block backticks. Return ONLY the raw JSON array.`
      : `You are a Senior Principal Software Architect and career mentor who is also funny.
Review this developer's GitHub flaws and give them exactly 3 funny, blunt, but GENUINELY actionable steps to redeem their profile.

DEVELOPER DATA:
@${username}
Total Repos: ${totalRepos ?? 0}
Top Language: ${_raw?.topLanguage || "unknown"}
Abandoned Repos: ${repoAnalysis?.abandonedCount ?? 0} of ${repoAnalysis?.totalOwn ?? 0}
Commit Message Quality: ${commitAnalysis?.qualityScore ?? 0}% (Worst commits: ${commitAnalysis?.shameList?.slice(0, 2).join(", ") || "none"})
README Status: ${readme?.exists ? (readme.isEmpty ? "empty" : "written") : "missing"}

RULES:
- Return a JSON array of strings containing EXACTLY 3 items: ["Tip 1", "Tip 2", "Tip 3"].
- Each tip should be 1-2 punchy sentences.
- Make it sound like tough love: humorous, specific, and actually helpful.
- No markdown, no intro, no code block backticks. Return ONLY the raw JSON array.`;

    try {
      const res = await fetch(
        `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              topP: 0.95,
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (res.ok) {
        const json = await res.json();
        let text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        text = text.replace(/^```json\s*|```$/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed.slice(0, 3).map((item) => String(item).trim());
        }
      }
    } catch (err) {
      logger.warn("AI", "Redemption plan generation failed", { message: err.message });
    }
  }

  if (isRepo) {
    const repoFallback = [];
    if (!data.hasTests) repoFallback.push("Add automated CI tests so production users don't have to be your QA team.");
    if ((data.commitQuality ?? 100) < 60) repoFallback.push("Enforce commit linters to stop committing vague messages like 'wip' or 'fix'.");
    if (!data.hasReadme) repoFallback.push("Write a comprehensive README with setup instructions and architecture diagrams.");
    if ((data.monthsInactive ?? 0) > 6) repoFallback.push("Archive this repo if it's dead, or tag a maintenance release if it's stable.");
    if (repoFallback.length < 3) repoFallback.push("Add a CONTRIBUTING.md guide and issue templates to professionalize the project.");
    return repoFallback.slice(0, 3);
  }

  const fallback = [];
  if ((repoAnalysis?.abandonedPct ?? 0) > 40) {
    fallback.push(`Archive or delete the ${repoAnalysis?.abandonedCount || 0} abandoned repos collecting digital dust.`);
  }
  if ((commitAnalysis?.qualityScore ?? 0) < 60) {
    fallback.push(`Ban yourself from writing single-word commit messages like "${commitAnalysis?.shameList?.[0] || 'fix'}" — use conventional commits.`);
  }
  if (!readme?.exists || readme?.isEmpty) {
    fallback.push("Write at least one real README explaining what your code actually does and how to run it.");
  }
  if (fallback.length < 3) {
    fallback.push("Pick one core project, build an automated test suite, and actually deploy it to production.");
  }
  return fallback.slice(0, 3);
}

module.exports = {
  generateAIRoast,
  generateAIRoastStream,
  generateAIRepoRoast,
  generateAIRedemptionPlan,
  buildRepoRoastPrompt,
  GEMINI_MODEL,
  resolveGeminiModel,
  PERSONA_CONFIG,
};

