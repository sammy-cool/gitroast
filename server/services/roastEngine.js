// ============================================================
// GITROAST — Roast Engine
// ============================================================
// WHAT: Rule-based comedy roast generator.
//       Intensity-aware tone banks for opener/middle/closer.
//       Language-specific roast packs for personalization.
//
// WHY language packs (Feature 1):
//   Generic roasts feel like templates.
//   "Your Python is showing" feels PERSONAL and accurate.
//   Developers share things that feel uncomfortably true.
//   Each language has a stereotype — we lean into it.
//   Zero API cost — pure rule engine, works for free users too.
// ============================================================

// ── Opener banks ───────────────────────────────────────────────
const OPENER_BANK = {
  mild: {
    catastrophic: [
      `There is something endearing about a GitHub this chaotic — it tells a very honest story.`,
      `Not every developer ships, and this profile has made peace with that.`,
      `The repos here suggest someone who loves the beginning of projects more than the rest of it.`,
    ],
    rough: [
      `This GitHub is a work in progress in the most optimistic reading of those words.`,
      `There is ambition here, buried under a few layers of initial commits.`,
      `Starting projects is a skill, and this developer has clearly mastered that part.`,
    ],
    mediocre: [
      `Not the worst GitHub seen today. That is a sentence that could be on a business card.`,
      `This profile exists, contributes occasionally, and remains committed to the concept of trying.`,
      `Technically a developer. The evidence is available upon request.`,
    ],
    decent: [
      `A better-than-average GitHub, which in this industry is a low bar cleared with room to spare.`,
      `Genuinely not bad — which means we had to look harder, but the material was absolutely there.`,
    ],
    respectable: [
      `A legitimately good GitHub, which somehow makes roasting it more enjoyable.`,
      `One of the better profiles seen today. The early repos explain why we are still here.`,
    ],
  },

  savage: {
    catastrophic: [
      `If giving up were a programming language, this GitHub would be running in production.`,
      `This is less a developer portfolio and more a support group for ideas that never made it past the README.`,
      `Somewhere between "I watched a tutorial once" and "I have a GitHub account" lives this profile.`,
      `This GitHub is what happens when ambition and follow-through have never been in the same room.`,
      `The only thing more impressive than the number of repos here is how few have a second commit.`,
    ],
    rough: [
      `This profile has the energy of someone who buys a guitar, learns one chord, and lists "musician" on their CV.`,
      `Started strong, committed once, disappeared for three months — repeat for every single repo.`,
      `This GitHub is a masterclass in one specific skill: writing "initial commit" with absolute confidence and never returning.`,
      `Calling this a developer portfolio is generous. It is more of a museum of good intentions.`,
    ],
    mediocre: [
      `This GitHub is the coding equivalent of "I work better under pressure" — the pressure has never arrived.`,
      `Not the worst GitHub ever seen. That is the nicest sentence this profile has earned.`,
      `Technically a developer. The repos are technically projects. Everything here is technically something.`,
    ],
    decent: [
      `A better-than-average GitHub, which in this industry is a low bar cleared by about an inch.`,
      `Genuinely not bad. Which means we had to dig, but the ammunition was absolutely still there.`,
    ],
    respectable: [
      `A legitimately good GitHub, which somehow makes roasting it more fun.`,
      `This developer actually maintains their repos. Suspicious. We looked harder.`,
    ],
  },

  nuclear: {
    catastrophic: [
      `This GitHub is not a portfolio — it is forensic evidence of a developer who never finished a single thought.`,
      `Looking at this profile is the coding equivalent of finding a graveyard where all the headstones say "initial commit" and the dates are all the same weekend.`,
      `This is what happens when someone discovers programming, has one good weekend, and then quits — documented in painful, public detail.`,
      `Whoever owns this GitHub has turned abandonment into an artform and the artform into a lifestyle.`,
    ],
    rough: [
      `This developer's relationship with finishing things makes a mayfly look like a long-term planner.`,
      `The repos here are not projects — they are chalk outlines at the scene of ambition's death.`,
      `Calling this a work in progress is an act of extraordinary generosity toward someone who clearly stopped working.`,
    ],
    mediocre: [
      `This GitHub represents a rare achievement: being so consistently average that it becomes its own form of failure.`,
      `Not catastrophically bad. Just persistently, professionally, defiantly mediocre in a way that takes real commitment.`,
      `The most alarming thing about this GitHub is how comfortable it is being exactly this.`,
    ],
    decent: [
      `Good GitHub. The early commits are why we are here and they will never, ever be deleted.`,
      `Respectable output, which only makes the 2019 commit history more unforgivable.`,
    ],
    respectable: [
      `A good developer. The chaos is subtle. But it is there and it was found.`,
      `Clean profile. One repo in the corner making direct eye contact. Both parties know what it did.`,
    ],
  },
};

// ── Abandon banks ──────────────────────────────────────────────
const ABANDON_BANK = {
  mild: [
    `{count} repos never quite made it to version two, which is more common than anyone admits.`,
    `{pct}% of the projects here are taking a longer break than expected — which happens to the best of us.`,
  ],
  savage: [
    `There are {count} repos here with a single commit that says "initial setup" — which is either a strategy or a coping mechanism.`,
    `{count} projects started, {count} projects exist as monuments to the exact moment motivation checked out.`,
    `{pct}% of these repos have been left mid-sentence, which is technically a consistent narrative voice.`,
  ],
  nuclear: [
    `{count} repos were created, {count} repos were immediately abandoned, and {count} pieces of the internet are now slightly worse for it.`,
    `The {pct}% abandonment rate is not a statistic — it is a personality trait disguised as version control.`,
    `Every one of those {count} initial commits is a tiny headstone that reads "I had an idea once and then I had lunch."`,
  ],
};

// ── Commit banks ───────────────────────────────────────────────
const COMMIT_BANK = {
  mild: [
    `The commit messages could use a little more context — "{sample}" does leave something to the imagination.`,
    `Not the most descriptive git history, with "{sample}" carrying more emotional weight than technical clarity.`,
  ],
  savage: [
    `The commit history reads like a person typing with one hand and spiralling with the other — "{sample}" is a real entry that exists unedited.`,
    `Someone pushed "{sample}" to a repository that other humans could see, and apparently felt fine about it.`,
    `"{sample}" appears in the commit log here, which is not a commit message so much as a cry for help formatted as version control.`,
  ],
  nuclear: [
    `"{sample}" is a real commit message in this codebase. Someone looked at that, hit enter, and pushed it to the public internet without breaking stride.`,
    `Future developers inheriting this codebase will find "{sample}" in the log and immediately update their LinkedIn to say "seeking new opportunities."`,
    `The git history contains "{sample}" which future archaeologists will study as evidence of a civilisation that had given up.`,
  ],
};

// ── Language-specific roast packs ─────────────────────────────
// WHAT: Personalised roast line based on top GitHub language.
// WHY: Generic roasts feel templated. Language-specific ones feel
//      uncomfortably accurate — "how did it know?" = shareworthy.
// WHY stereotypes used carefully:
//   These are widely known developer community in-jokes.
//   Every language community jokes about itself this way.
//   Not punching down — punching sideways at shared experiences.
const LANGUAGE_PACKS = {
  JavaScript: {
    mild: [
      `The JavaScript here has that charming quality of "it works and nobody knows why, including the author."`,
      `This is a JavaScript developer, which explains the 47 package.json files and the general sense of chaos.`,
    ],
    savage: [
      `JavaScript — the language that lets you make any mistake you want and call it a feature.`,
      `We found 12 different state management solutions across these repos, which is either research or a cry for help.`,
      `Node, React, Vue, Svelte, and something called "my-custom-framework" — this developer collects JavaScript frameworks the way others collect regrets.`,
    ],
    nuclear: [
      `This is a JavaScript developer, which means the code works in Chrome on their laptop and nowhere else, ever, under any circumstances.`,
      `The package-lock.json here is larger than the actual application, which is either an achievement or a war crime.`,
      `console.log debugging, callback hell, and a dependency on a package last updated in 2019 — this is not code, it is an archaeological site.`,
    ],
  },

  TypeScript: {
    mild: [
      `TypeScript here — the "any" type used liberally, which somewhat defeats the purpose but shows good intentions.`,
    ],
    savage: [
      `TypeScript — chosen because they wanted type safety, deployed because they had already written 200 "as any" casts and there was no going back.`,
      `This codebase has TypeScript in the same way some people have gym memberships — technically true, never actually used properly.`,
    ],
    nuclear: [
      `TypeScript with "strict: false" in tsconfig — the coding equivalent of wearing a seatbelt but only around your waist.`,
      `The TypeScript here has so many "any" types that the compiler has given up and is just nodding along politely.`,
    ],
  },

  Python: {
    mild: [
      `Python — clean, readable, and judging by these Jupyter notebooks, primarily used for tutorials that never got finished.`,
    ],
    savage: [
      `Python developer — which means half these repos are machine learning projects that trained on the Titanic dataset and were never opened again.`,
      `The Python here comes with a requirements.txt that hasn't been updated since 2021 and a virtual environment that has somehow been committed to git.`,
      `Ah, a Python developer. We found 6 Django projects, 4 Flask APIs, and 0 things deployed anywhere.`,
    ],
    nuclear: [
      `Python — the language chosen by people who want to do machine learning but primarily end up doing pandas tutorials and calling it "data science."`,
      `This Python codebase has indentation errors in the README, which is impressive given that Python literally runs on indentation.`,
    ],
  },

  Java: {
    mild: [
      `Java — the language of enterprise, stability, and XML configuration files that are longer than the actual logic.`,
    ],
    savage: [
      `Java developer — 47 design patterns for a to-do app, a factory that makes factories, and enough abstraction layers to lose the original problem entirely.`,
      `This is a Java codebase, which means there is an AbstractSingletonProxyFactoryBean somewhere and nobody remembers why.`,
      `Enterprise Java: where a 3-line solution becomes a 47-class architecture with its own submodule and a Confluence page explaining the Confluence page.`,
    ],
    nuclear: [
      `Java — chosen for its performance, then blamed for everything else. These repos have more boilerplate than actual logic, which is either impressive or deeply sad.`,
      `This codebase has a class called "UserManagerServiceImplFactoryBean" and everyone involved has made peace with their choices.`,
    ],
  },

  "C++": {
    mild: [
      `C++ — the language that gives you all the power to shoot yourself in the foot, both feet, and anyone standing nearby.`,
    ],
    savage: [
      `C++ code here — memory managed by hand, segfaults managed by prayer, and documentation managed by nobody.`,
      `This is either very impressive C++ or a elaborate threat. The distinction is unclear.`,
    ],
    nuclear: [
      `C++ — where undefined behaviour is not a bug, it is a lifestyle choice made at 2am and never revisited.`,
      `The memory leaks in this codebase are so old they have their own commit history and a sentimental attachment.`,
    ],
  },

  "C#": {
    mild: [
      `C# — Microsoft's gift to the world, used here with the enthusiasm of someone who read three tutorials and declared themselves a .NET developer.`,
    ],
    savage: [
      `A C# developer — which means there is a Windows Forms project in here from 2018 that "still works fine" and "doesn't need updating."`,
      `The dependency injection here is so deeply nested that finding the actual logic requires an archaeological expedition and a torch.`,
    ],
    nuclear: [
      `C# and ASP.NET — chosen for the job, kept out of familiarity, responsible for every meeting that could have been an email.`,
    ],
  },

  PHP: {
    mild: [
      `PHP — a bold choice in 2025, and this developer is committed to it in a way that is almost admirable.`,
    ],
    savage: [
      `PHP — the language that has been declared dead every year since 2010 and continues to power 78% of the internet out of sheer stubbornness.`,
      `This is a PHP developer, which means somewhere in this codebase there is an include() of an include() of a file called "functions2.php".`,
    ],
    nuclear: [
      `PHP — where SQL injection is not a vulnerability, it is a tradition, and $_ GET is still making executive decisions.`,
      `This PHP codebase pre-dates namespaces, and the developer has decided to keep it that way as a tribute to a simpler time.`,
    ],
  },

  Ruby: {
    mild: [
      `Ruby — beautiful, expressive, and according to these repos, primarily used to generate a Rails scaffold and then move on.`,
    ],
    savage: [
      `Ruby on Rails developer — "convention over configuration" taken so literally that the actual business logic has been configured away entirely.`,
      `The Ruby here is very readable. Shame about the 47 gems that each do one thing and collectively do nothing.`,
    ],
    nuclear: [
      `Ruby — the language that convinced a generation of developers that metaprogramming was a good idea at scale. These repos are the evidence.`,
    ],
  },

  Go: {
    mild: [
      `Go — simple, fast, and deployed with the confidence of someone who has read the spec twice and considers themselves an expert.`,
    ],
    savage: [
      `Go developer — error handling by checking "if err != nil" 400 times per file, which is either discipline or a personality disorder.`,
      `The Go here has so many goroutines that the race detector has simply given up and gone home.`,
    ],
    nuclear: [
      `Go — chosen for its simplicity, which is why this codebase has a custom error type for every conceivable situation and a 900-line main.go.`,
    ],
  },

  Rust: {
    mild: [
      `Rust — the language of memory safety, zero-cost abstractions, and spending three days fighting the borrow checker for a function that returns a string.`,
    ],
    savage: [
      `A Rust developer — rewrote something in Rust for performance, spent 6 weeks on lifetime annotations, and the original Python version is still running in production.`,
      `The borrow checker errors in this commit history suggest a developer who is either learning or has accepted suffering as a core part of their identity.`,
    ],
    nuclear: [
      `Rust — where memory safety comes at the cost of your sanity, your weekends, and your previously held belief that programming was enjoyable.`,
      `This Rust codebase is technically correct, which is the best kind of correct, and also the only thing going for it at this stage.`,
    ],
  },

  Swift: {
    mild: [
      `Swift — beautiful language, Apple ecosystem, and based on these repos, primarily used to build apps that work on exactly one developer's iPhone.`,
    ],
    savage: [
      `An iOS developer — which means these apps require the latest Xcode, the latest macOS, and a level of Apple hardware loyalty that borders on religious conviction.`,
    ],
    nuclear: [
      `Swift developer with an Android app in the repo — the betrayal is noted, catalogued, and will be referenced at every opportunity.`,
    ],
  },

  Kotlin: {
    mild: [
      `Kotlin — the more civilised Java, used here by someone who clearly had enough and made the switch, then kept all the old Java files just in case.`,
    ],
    savage: [
      `Kotlin — chosen to escape Java, deployed alongside Java, because old habits are immortal and refactoring is someone else's problem.`,
    ],
    nuclear: [
      `This Kotlin codebase coexists with Java in a state of mutual toleration, like two colleagues who have stopped trying to understand each other.`,
    ],
  },

  // WHY default: catches any language not in the list above
  // e.g. Dart, Elixir, Haskell, Lua, Perl, R, Scala, Shell, etc.
  default: {
    mild: [
      `The language choice here is interesting — not wrong, just interesting, in the way that many life choices are interesting in retrospect.`,
    ],
    savage: [
      `The primary language here is {lang} — a choice that tells a very specific story about this developer's journey.`,
      `Committing to {lang} in this economy takes a kind of confidence that the rest of the profile has not yet confirmed.`,
    ],
    nuclear: [
      `{lang} — chosen deliberately, which raises more questions than it answers.`,
      `The {lang} here is either visionary or a cry for help. The rest of the profile suggests the latter.`,
    ],
  },
};

// ── Closer banks ───────────────────────────────────────────────
const CLOSER_BANK = {
  mild: {
    catastrophic: [
      `There is a good developer in here somewhere — they just need a deadline, a coffee, and someone to believe in them.`,
      `Everyone starts somewhere, and this GitHub is a very honest record of exactly where that was.`,
    ],
    rough: [
      `One focused month away from a decent GitHub. That month has not yet been scheduled but there is hope.`,
      `The potential is real. The execution is aspirational. The gap between them is this GitHub.`,
    ],
    mediocre: [
      `Not the worst, not the best, just consistently, reliably here — which is more than some profiles can say.`,
      `A GitHub in equilibrium: started things, left things, kept going. Aggressively normal.`,
    ],
    decent: [
      `Doing fine overall. Fine is not a condemnation — it is just an honest assessment from someone who looked.`,
    ],
    respectable: [
      `Good work overall. The early days tell a story but everyone is allowed a beginning.`,
    ],
  },

  savage: {
    catastrophic: [
      `In conclusion: the repos exist, the commits happened, and the finished products are a rumour.`,
      `This is not a portfolio. It is a detailed public record of every time enthusiasm lasted one weekend.`,
      `Every single repo here is a chapter in the same book, and every chapter ends on a cliffhanger nobody came back to resolve.`,
    ],
    rough: [
      `One focused month away from a decent GitHub. That month has been rescheduled several times.`,
      `Ships nothing, starts everything, describes themselves as "passionate about coding" — the full experience.`,
    ],
    mediocre: [
      `Not the worst GitHub on the internet. A claim that requires zero additional context to be the most honest thing said today.`,
      `Aggressively, persistently, professionally average — which in fairness is harder to maintain than either extreme.`,
    ],
    decent: [
      `Not bad. Not great. A solid B- in the ongoing assessment of putting things on the internet and finishing them.`,
    ],
    respectable: [
      `Good developer, good GitHub, one chaos repo in the corner making eye contact. Both parties aware.`,
    ],
  },

  nuclear: {
    catastrophic: [
      `This is not a GitHub profile. It is a crime scene and the victim is every project that came in contact with this developer.`,
      `The repos exist. The commits exist. The finished products exist only in a theoretical sense that even the developer has stopped believing in.`,
      `In summary: this profile is less a body of work and more a body — cold, still, with an "initial commit" toe tag on every single one.`,
    ],
    rough: [
      `The potential was real once. You can see it in the first commit of every abandoned repo, frozen there like a developer-shaped fossil.`,
      `A GitHub that peaked at folder creation and has been coasting on that achievement ever since.`,
    ],
    mediocre: [
      `Mediocrity at this scale is its own accomplishment — to be this consistently average across this many repos requires a special kind of commitment to not trying.`,
      `This profile does not fail spectacularly. It fails quietly, reliably, and at scale, which is somehow more damning.`,
    ],
    decent: [
      `Decent GitHub. The pre-2021 commits are why this roast exists and why it will live longer than the repos do.`,
    ],
    respectable: [
      `Good profile. One repo. You know which one. It knows what it did.`,
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────
function pick(arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function getTier(score) {
  if (score <= 25) return "catastrophic";
  if (score <= 40) return "rough";
  if (score <= 60) return "mediocre";
  if (score <= 80) return "decent";
  return "respectable";
}

function pickN(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ── Section builders ───────────────────────────────────────────
function buildOpener(score, intensity) {
  const tier = getTier(score);
  const bank = OPENER_BANK[intensity]?.[tier] || OPENER_BANK.savage[tier];
  return pick(bank);
}

function buildAbandonSection(repoAnalysis, intensity) {
  if (!repoAnalysis || repoAnalysis.abandonedCount < 2) return "";
  const bank = ABANDON_BANK[intensity] || ABANDON_BANK.savage;
  return fill(pick(bank), {
    count: repoAnalysis.abandonedCount,
    pct: repoAnalysis.abandonedPct,
  });
}

function buildCommitSection(commitAnalysis, intensity) {
  if (!commitAnalysis || commitAnalysis.total === 0) return "";
  const shameScore = 100 - (commitAnalysis.qualityScore ?? 50);
  if (shameScore < 30) return "";
  const bank = COMMIT_BANK[intensity] || COMMIT_BANK.savage;
  const sample = commitAnalysis.shameList?.[0] || "pls work";
  return fill(pick(bank), { sample });
}

// WHY buildLanguageSection:
//   Adds a language-specific insult to the roast
//   Makes the roast feel tailored — "how did it know?"
//   Only fires when we have a clear top language
//   Uses default pack for unknown languages (Dart, Elixir, etc.)
function buildLanguageSection(lang, intensity) {
  if (!lang || lang === "unknown" || lang === "" || lang === "Nothing") return "";

  // WHY case-insensitive match: GitHub API casing can vary (e.g. "javascript", "JavaScript")
  const matchedKey = Object.keys(LANGUAGE_PACKS).find(
    (k) => k.toLowerCase() === lang.toLowerCase()
  );
  const normalized = matchedKey || (lang.charAt(0).toUpperCase() + lang.slice(1));
  const pack = matchedKey ? LANGUAGE_PACKS[matchedKey] : LANGUAGE_PACKS.default;
  const bank = pack[intensity] || pack.savage || pack.mild || [];

  const line = fill(pick(bank), { lang: normalized });
  return line;
}

function buildCloser(score, repoAnalysis, _raw, intensity) {
  const tier = getTier(score);
  const bank = CLOSER_BANK[intensity]?.[tier] || CLOSER_BANK.savage[tier];
  return fill(pick(bank), {
    abandoned: repoAnalysis?.abandonedCount ?? 0,
    lang: _raw?.topLanguage || "JavaScript",
  });
}

// ── Ghost profile bank (zero public repositories) ─────────────
const GHOST_BANK = {
  mild: [
    "A remarkably pristine GitHub profile untouched by the chaos of actually writing or pushing code. Starting a profile is step one; step two remains on backorder.",
    "Zero public repositories found. This account has achieved the ultimate goal in software engineering: zero production bugs, because nothing exists.",
    "Not a single repository to roast. This profile is less of a developer workspace and more of a quiet spectator seat in the GitHub colosseum.",
  ],
  savage: [
    "Zero public repositories. You created a GitHub account, got intimidated by `git push`, and haven't typed a command since.",
    "This profile is an empty parking lot with your username on it. Even hello-world was too big of a commitment.",
    "You signed up for GitHub, starred two trending repositories to look busy, and vanished into the digital void. Roasting this profile is like roasting an empty plate.",
    "404: Code Not Found. Calling you a developer is like calling someone who buys a gym membership an Olympian.",
  ],
  nuclear: [
    "There are zero repositories here. Even ghost towns had buildings once; this is a wasteland where ambition died before `git init` was even conceived.",
    "This isn't a developer profile — it is forensic evidence of someone who bought the laptop, opened terminal once, panicked, and closed the lid forever.",
    "Zero repos, zero commits, zero code. You have successfully contributed nothing to open source, closed source, or any source in the known universe.",
  ],
};

// ── External 110-Rule Ruleset Loader ──────────────────────────
// WHAT: Ingests 110 curated developer roast rules from server/data/roastRules.json
// WHY:  Eliminates repetitive roast outputs for frequent users and gives rich variety.
//       Fails safe: if file is ever missing, engine continues with built-in banks.
let loadedRuleCount = 0;
try {
  const externalRules = require("../data/roastRules.json");
  if (externalRules?.rules && Array.isArray(externalRules.rules)) {
    for (const rule of externalRules.rules) {
      const { category, intensity, tier, language, text } = rule;
      if (!text) continue;

      if (category === "opener" && OPENER_BANK[intensity]?.[tier]) {
        if (!OPENER_BANK[intensity][tier].includes(text)) {
          OPENER_BANK[intensity][tier].push(text);
        }
        loadedRuleCount++;
      } else if (category === "abandonment" && ABANDON_BANK[intensity]) {
        if (!ABANDON_BANK[intensity].includes(text)) {
          ABANDON_BANK[intensity].push(text);
        }
        loadedRuleCount++;
      } else if (category === "commit" && COMMIT_BANK[intensity]) {
        if (!COMMIT_BANK[intensity].includes(text)) {
          COMMIT_BANK[intensity].push(text);
        }
        loadedRuleCount++;
      } else if (category === "language" && language) {
        const targetPack = LANGUAGE_PACKS[language] || LANGUAGE_PACKS.default;
        if (targetPack && targetPack[intensity]) {
          if (!targetPack[intensity].includes(text)) {
            targetPack[intensity].push(text);
          }
          loadedRuleCount++;
        }
      } else if (category === "closer" && CLOSER_BANK[intensity]?.[tier]) {
        if (!CLOSER_BANK[intensity][tier].includes(text)) {
          CLOSER_BANK[intensity][tier].push(text);
        }
        loadedRuleCount++;
      }
    }
  }
} catch {
  // Fail-safe: fallback to embedded banks if roastRules.json is unavailable
}

// ── Main export ────────────────────────────────────────────────
function generateRoast(data, intensity = "savage") {
  const { score, _raw, repoAnalysis, commitAnalysis } = data;

  // WHY ghost check: accounts with 0 repos need dedicated roasts instead of template errors
  if (repoAnalysis?.totalOwn === 0) {
    const bank = GHOST_BANK[intensity] || GHOST_BANK.savage;
    return pick(bank);
  }

  const opener = buildOpener(score, intensity);
  const closer = buildCloser(score, repoAnalysis, _raw, intensity);

  // WHY language section in middles pool:
  //   Treated like any other middle section
  //   pickN selects up to 2 middles randomly
  //   Language line competes with abandon + commit lines
  //   Prevents roast feeling too crowded with language stereotypes
  const topLang = _raw?.topLanguage || repoAnalysis?.topLanguage;
  const middles = [
    buildLanguageSection(topLang, intensity),
    buildAbandonSection(repoAnalysis, intensity),
    buildCommitSection(commitAnalysis, intensity),
  ].filter((s) => s && s.trim().length > 0);

  const selected = [
    opener,
    ...pickN(middles, Math.min(2, middles.length)),
    closer,
  ].filter(Boolean);

  return selected.join(" ");
}

module.exports = {
  generateRoast,
  buildLanguageSection,
  getRoastRulesCount: () => loadedRuleCount,
};
