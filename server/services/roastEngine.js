// ============================================================
// GITROAST — Rule-Based Roast Engine
// WHY: zero dependency, instant, zero cost
//      generates funny roasts without any API call
//      Claude/Gemini is fallback — this runs for free users
// ============================================================

// ─── Roast template banks ────────────────────────────────
// WHY banks: random pick from pool = same score never
//            produces identical roast twice

const OPENER_BANK = {
    catastrophic: [
        `Calling this a developer portfolio is like calling a landfill a real estate investment.`,
        `If commitment issues were a GitHub profile, this would be it.`,
        `Somewhere between "I should learn to code" and "I give up" lives this GitHub.`,
        `This is what happens when inspiration has a longer lifespan than attention span.`,
        `The gap between the first commit and the last update tells a story. It's a tragedy.`,
    ],
    rough: [
        `There's potential here, buried under a lot of creative interpretation of the word "finished".`,
        `Not the worst GitHub on the internet. A bold claim, but technically defensible.`,
        `Started with ambition. Somewhere around repo number three, ambition took a personal day.`,
        `The commit history suggests someone who codes in bursts of inspiration separated by months of reflection.`,
        `This GitHub has the energy of someone who buys gym equipment in January.`,
    ],
    mediocre: [
        `Technically a developer. The evidence is present, though it could use some commits.`,
        `This GitHub sits in the uncanny valley between "just started" and "ships things".`,
        `Consistent in exactly one way: consistently almost there.`,
        `The code exists. Whether it runs is a question left as an exercise for the reader.`,
        `Not bad enough to roast easily, not good enough to defend. Comfortably average.`,
    ],
    decent: [
        `Decent GitHub. Still here. Still roastable. The commits gave it away.`,
        `Better than most, which still leaves plenty of room for this roast.`,
        `Almost has it together. The keyword being almost.`,
        `The GitHub equivalent of making your bed but leaving dishes in the sink.`,
        `Clean-ish. Respectable-ish. Roastable-ish.`,
    ],
    respectable: [
        `A good GitHub. We had to dig, but the ammunition was there.`,
        `Actually maintains repos. Suspicious behaviour for this industry.`,
        `Dangerously close to responsible developer territory. The early repos betray everything.`,
        `The public repos are fine. The commit messages from 2019 are not.`,
        `Good profile. One chaos repo in the corner staring back at us.`,
    ],
}

const ABANDON_BANK = [
    `{count} repos with a single lonely commit, whispering "initial setup" into the void.`,
    `Started {count} projects. Finished the part where you make the folder.`,
    `{pct}% of repos never made it past the scaffolding phase — but hey, the scaffolding looks great.`,
    `There are {count} repos here that peaked at "hello world" and decided that was enough.`,
    `The abandoned repos outnumber the active ones {count} to the rest, which is a ratio, not a plan.`,
    `{count} repos that died doing what they loved: existing as initial commits.`,
]

const COMMIT_BANK = {
    horrible: [
        `The commit messages read like autocomplete having a panic attack — "{sample}" is in there unironically.`,
        `Somewhere in this repo's history, someone typed "{sample}" and hit enter with full confidence.`,
        `The git log is less a development timeline and more a series of increasingly desperate "{sample}" entries.`,
        `"{sample}" is a real commit message here. The diff does not clarify things.`,
        `Future archaeologists will find "{sample}" in this commit history and have questions.`,
    ],
    bad: [
        `The commit messages suggest someone typing with one hand and giving up with the other — see: "{sample}".`,
        `"{sample}" appears in the commit history, which raises more questions than the code does.`,
        `Not the worst commit history, but "{sample}" is doing a lot of damage to that claim.`,
        `The commits are descriptive in the same way that "{sample}" is descriptive.`,
    ],
    acceptable: [
        `Mostly coherent commit messages, which puts this in the top half of GitHub. "{sample}" sneaks in occasionally.`,
        `The commits are readable. "{sample}" shows up now and then to keep things humble.`,
        `Decent commit hygiene. "{sample}" is an outlier. Probably.`,
    ],
}

const LANGUAGE_BANK = {
    PHP: [
        `The primary language is PHP in ${new Date().getFullYear()}, a choice made and apparently defended.`,
        `Still writing PHP. At this point it's not a language, it's a personality.`,
        `PHP is the main language here, which explains a lot and answers nothing.`,
    ],
    JavaScript: [
        `All JavaScript, which means node_modules has more commits than the actual product.`,
        `Full JavaScript stack. The package.json has more dependencies than completed features.`,
        `JavaScript everywhere — the repos multiply, the ships remain theoretical.`,
    ],
    Python: [
        `Python developer. The code is clean, the project scope is not.`,
        `Primary language Python — great for getting started, apparently less great for finishing.`,
        `Python repos as far as the eye can see, most of them ending somewhere between "works locally" and "never deployed".`,
    ],
    Java: [
        `Java. The language that requires four files to print hello world, and this repo has all four.`,
        `Java developer spotted. The AbstractFactoryBeanManager file is somewhere in here.`,
        `Java in production. Respect. The verbosity of the language matches the silence of the README.`,
    ],
    TypeScript: [
        `TypeScript everywhere, including three repos where type: any appears more than the actual types.`,
        `TypeScript purist. Has judged a JavaScript file this week. The repos remain unfinished.`,
        `Full TypeScript stack, because if the code is going to sit undeployed, it should at least be type-safe.`,
    ],
    Rust: [
        `Rust developer. Has mentioned memory safety in casual conversation. The repos are safe if nothing else.`,
        `Writing Rust, which means the borrow checker is satisfied even if the project isn't finished.`,
        `Rust main language — technically impressive, practically same number of deployed projects as everyone else.`,
    ],
    'C++': [
        `C++ developer. Manages memory manually, the repos less so.`,
        `C++ as the primary language, which is either brave or a very specific kind of commitment.`,
        `Writing C++ in ${new Date().getFullYear()}. The segfaults are someone else's problem. The abandoned repos are not.`,
    ],
    default: [
        `Primary language {lang} — an interesting hill to build a portfolio on.`,
        `Mostly {lang}, which is a choice that was made and stuck with.`,
        `The {lang} era is well-documented here. The deployment era less so.`,
    ],
}

const README_BANK = {
    missing: [
        `The top repo has no README, which is one way to ensure nobody ever runs the code but you.`,
        `Zero documentation. The code speaks for itself. Unfortunately it's speaking in tongues.`,
        `No README anywhere near the top repo — open source in theory, impenetrable in practice.`,
    ],
    empty: [
        `The README exists. It has a title. That's where the story ends.`,
        `There is a README. It contains a project name and the quiet despair of an empty file.`,
        `The README is technically present in the same way a scarecrow is technically a person.`,
    ],
    exists: [
        `Actually wrote a README with real content — a rare and noble act in this industry.`,
        `The README has actual information in it, which immediately puts this in the top 30% of GitHub.`,
    ],
}

const CLOSER_BANK = {
    catastrophic: [
        `In summary: the code exists, the commits happened, the projects did not survive.`,
        `The GitHub is not abandoned — it's more of an open-ended creative pause that started {years} years ago.`,
        `This is not a portfolio. It is evidence. What of, exactly, is between you and the commit logs.`,
        `Every repo is one more unfinished sentence in a very long story about getting started.`,
    ],
    rough: [
        `There's a good developer in here somewhere, surrounded by {abandoned} repos that never found out.`,
        `One focused sprint away from a decent GitHub. That sprint has not yet been scheduled.`,
        `The potential is real. The follow-through is aspirational.`,
        `Ships nothing, starts everything, remains technically a developer.`,
    ],
    mediocre: [
        `Not the worst GitHub on the internet. Not the best. Aggressively, persistently middle.`,
        `Exists on GitHub. Commits occasionally. Finishes things in a more of a spiritual sense.`,
        `A GitHub in equilibrium: equal parts started and abandoned, perpetually almost there.`,
    ],
    decent: [
        `Doing fine. Fine is the most haunting word in software development.`,
        `Better than average. Still roastable. The {lang} phase lives in the early repos forever.`,
        `Not bad. Not great. A solid B- in the ongoing exam of putting things on the internet.`,
    ],
    respectable: [
        `Good GitHub overall. The one chaotic repo in the corner knows what it did.`,
        `Earned a respectful roast. The early commits are the gift that keeps giving.`,
        `The current repos are fine. The 2019 ones are why we're here.`,
    ],
}

// ─── Helpers ─────────────────────────────────────────────

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

function getTier(score) {
    if (score <= 25) return 'catastrophic'
    if (score <= 40) return 'rough'
    if (score <= 60) return 'mediocre'
    if (score <= 80) return 'decent'
    return 'respectable'
}

function pickN(arr, n) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// ─── Section builders ────────────────────────────────────

function buildOpener(score) {
    const tier = getTier(score)
    return pick(OPENER_BANK[tier])
}

function buildAbandonSection(repoAnalysis) {
    if (!repoAnalysis || repoAnalysis.abandonedCount === 0) return ''
    return fill(pick(ABANDON_BANK), {
        count: repoAnalysis.abandonedCount,
        pct: repoAnalysis.abandonedPct,
    })
}

function buildCommitSection(commitAnalysis) {
    if (!commitAnalysis || commitAnalysis.total === 0) return ''
    const shameScore = 100 - (commitAnalysis.qualityScore ?? 50)
    const tier = shameScore > 70 ? 'horrible'
        : shameScore > 40 ? 'bad'
            : 'acceptable'
    const sample = commitAnalysis.shameList?.[0] || 'initial commit'
    return fill(pick(COMMIT_BANK[tier]), { sample })
}

function buildLanguageSection(_raw) {
    if (!_raw?.topLanguage || _raw.topLanguage === 'Nothing') return ''
    const lang = _raw.topLanguage
    const templates = LANGUAGE_BANK[lang] || LANGUAGE_BANK.default
    return fill(pick(templates), { lang, year: new Date().getFullYear() })
}

function buildReadmeSection(readme) {
    if (!readme) return ''
    if (!readme.exists) return pick(README_BANK.missing)
    if (readme.isEmpty) return pick(README_BANK.empty)
    return pick(README_BANK.exists)
}

function buildCloser(score, repoAnalysis, _raw) {
    const tier = getTier(score)
    return fill(pick(CLOSER_BANK[tier]), {
        abandoned: repoAnalysis?.abandonedCount ?? 0,
        years: new Date().getFullYear() - (_raw?.joinYear ?? new Date().getFullYear()),
        lang: _raw?.topLanguage || 'JavaScript',
    })
}

// ─── MAIN EXPORT ─────────────────────────────────────────
function generateRoast(data) {
    const { score, _raw, repoAnalysis, commitAnalysis, readme } = data

    const opener = buildOpener(score)
    const abandon = buildAbandonSection(repoAnalysis)
    const commits = buildCommitSection(commitAnalysis)
    const language = buildLanguageSection(_raw)
    const readmeS = buildReadmeSection(readme)
    const closer = buildCloser(score, repoAnalysis, _raw)

    // WHY: filter empty, pick best middle sections, always keep opener + closer
    const middleSections = [abandon, commits, language, readmeS]
        .filter(s => s && s.trim().length > 0)

    // WHY: 2 middle sections max — roast should be punchy not exhaustive
    const selected = [
        opener,
        ...pickN(middleSections, 2),
        closer,
    ].filter(Boolean)

    return selected.join(' ')
}

module.exports = { generateRoast }