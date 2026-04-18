// ─── Intensity-aware opener banks ────────────────────────
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

// ─── Middle section banks — same across intensities ───────
// WHY: the middle sections vary by tone adjective not template structure
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

// ─── Helpers ─────────────────────────────────────────────
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

// ─── Section builders ────────────────────────────────────
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

function buildCloser(score, repoAnalysis, _raw, intensity) {
  const tier = getTier(score);
  const bank = CLOSER_BANK[intensity]?.[tier] || CLOSER_BANK.savage[tier];
  return fill(pick(bank), {
    abandoned: repoAnalysis?.abandonedCount ?? 0,
    lang: _raw?.topLanguage || "JavaScript",
  });
}

// ─── MAIN EXPORT ─────────────────────────────────────────
function generateRoast(data, intensity = "savage") {
  const { score, _raw, repoAnalysis, commitAnalysis } = data;

  const opener = buildOpener(score, intensity);
  const closer = buildCloser(score, repoAnalysis, _raw, intensity);

  const middles = [
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

module.exports = { generateRoast };
