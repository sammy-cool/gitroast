// ============================================================
// GITROAST — Rule-Based Roast Engine
// WHY: Zero dependency, zero cost, instant.
//      Generates savage but funny roasts from GitHub data.
//      AI API is fallback — this runs first always.
// ============================================================

// ─── Roast Template Banks ────────────────────────────────
// WHY banks: randomize from pool so same score doesn't
//     always produce identical roast. Keeps it fresh.

const OPENER_BANK = {
    // Score 1-25: absolute disaster
    catastrophic: [
        `@{u}'s GitHub is less a portfolio and more a crime scene.`,
        `Archaeologists studying @{u}'s GitHub have declared it a site of historical abandonment.`,
        `@{u}'s commit history reads like a diary of someone who never finishes their sentences`,
        `Scientists studying @{u}'s GitHub have identified a new syndrome: chronic initial-commit disorder.`,
        `@{u}'s GitHub profile is what happens when ambition meets attention span in a dark alley.`,
    ],
    // Score 26-40: bad but trying
    rough: [
        `@{u} clearly codes with the energy of someone who just discovered programming and immediately regretted it.`,
        `@{u}'s GitHub tells the story of a developer who starts strong and finishes... eventually. Maybe.`,
        `Looking at @{u}'s profile, it seems the real project was the friends we abandoned along the way.`,
        `@{u} has committed to committing. The code, however, remains uncommitted.`,
        `@{u}'s repos have more unfinished business than a Season 1 Netflix show.`,
    ],
    // Score 41-60: mediocre
    mediocre: [
        `@{u} is technically a developer. The evidence is mixed.`,
        `@{u}'s GitHub sits in the uncanny valley between "hobbyist" and "professional".`,
        `@{u} codes with the consistency of British weather — occasionally brilliant, mostly unpredictable.`,
        `@{u} has what statisticians call "a bimodal distribution" of effort: bursts and silence.`,
        `@{u}'s GitHub profile is a testament to the phrase "good enough".`,
    ],
    // Score 61-80: decent but roastable
    decent: [
        `@{u} is better than average, which still leaves plenty of room to roast.`,
        `@{u} almost has it together. Almost.`,
        `@{u}'s GitHub is the coding equivalent of making your bed but leaving dishes in the sink.`,
        `@{u} writes code the way most people do housework — well when company's coming.`,
        `@{u} is what happens when "I'll fix it later" becomes a lifestyle.`,
    ],
    // Score 81-99: actually decent, gentle roast
    respectable: [
        `@{u} has decent GitHub hygiene — still roastable, but we had to try harder.`,
        `@{u} actually maintains their repos. Suspicious.`,
        `@{u} is dangerously close to being a responsible developer. Don't worry, the commits give it away.`,
        `@{u} cleans up their GitHub. The skeletons, however, are still there.`,
        `@{u} has the audacity to have a good profile. We found the dirt anyway.`,
    ],
}

const ABANDON_BANK = [
    `{count} repos started, {count} repos forgotten. At least they're consistent.`,
    `{count} of those repos have the same lifecycle: excited README-less creation → one commit → eternal silence.`,
    `{pct}% abandonment rate. That's not a GitHub profile, that's a graveyard with WiFi.`,
    `{count} repos haven't been touched since their creation day. A moment of silence for the fallen.`,
    `The abandoned repos alone could fill a museum exhibit titled "Dreams I Had at 2am".`,
    `{pct}% of repos exist solely to prove the developer had an idea once.`,
]

const COMMIT_BANK = {
    // shame score > 70
    horrible: [
        `Commit messages include classics like {sample}. Poetry for the ages.`,
        `The commit history reads like autocorrect having a breakdown: {sample}.`,
        `{sample} — this is not a commit message, this is a cry for help.`,
        `Forensic analysts studying the commits found {sample} and immediately filed for emotional damages.`,
        `The commits tell a story. That story is {sample}. We're sorry.`,
    ],
    // shame score 40-70
    bad: [
        `Commit messages are... descriptive. "{sample}" tells us everything and nothing.`,
        `The commits suggest a developer who writes code faster than they write descriptions.`,
        `"{sample}" is in the commit history. We're not judging. We're absolutely judging.`,
        `Commit quality: technically present. Spiritually absent. See: "{sample}".`,
    ],
    // shame score < 40
    acceptable: [
        `Commit messages are acceptable. A few "{sample}" slip through, but who among us.`,
        `The commits are coherent, which puts them in the top 30% of GitHub.`,
        `Descriptive commits. Mostly. "{sample}" sneaks in occasionally like an old habit.`,
    ],
}

const LANGUAGE_BANK = {
    PHP: [
        `The primary language is PHP. We'll give you a moment to explain yourself.`,
        `PHP in {year}. Bold choice. Controversial. Legally, we cannot say more.`,
        `Still writing PHP in {year}. The calls are coming from inside the framework.`,
    ],
    JavaScript: [
        `JavaScript everywhere. package.json has more dependencies than relationships.`,
        `Full JavaScript stack. node_modules weighs more than the actual product.`,
        `JavaScript is the language of choice. npm install is basically a personality trait at this point.`,
    ],
    Python: [
        `Python developer. The indentation is clean; the life choices, less so.`,
        `Primary language: Python. The snake is appropriate — projects hiss and disappear.`,
        `Python for everything. Including things that probably shouldn't be Python.`,
    ],
    Java: [
        `Java. The language that makes you write 400 lines to do what Python does in 4.`,
        `Java developer spotted. AbstractFactoryBeanBuilderManager.java has entered the chat.`,
        `Java in the repos. Enterprise patterns detected. Soul: optional.`,
    ],
    CSS: [
        `CSS is somehow the primary language. The flexbox alignment is wrong somewhere. It always is.`,
        `CSS-first developer. Margin: auto. Life: uncentered.`,
    ],
    TypeScript: [
        `TypeScript purist. Spends 40% of time fighting the compiler, 60% judging JavaScript developers.`,
        `TypeScript everywhere. type: any detected in 3 repos. The hypocrisy is noted.`,
    ],
    'C++': [
        `C++ developer. Manages their own memory, cannot manage their own repos.`,
        `C++. Respectable. The segmentation faults are someone else's problem... eventually.`,
    ],
    Rust: [
        `Rust developer. Has mentioned memory safety unprompted at least once this week.`,
        `Rust. The borrow checker is satisfied. The commit messages are not.`,
    ],
    default: [
        `Primary language: {lang}. Interesting choice. The repos speak for themselves.`,
        `Commits primarily in {lang}. We'll allow it. The abandoned repos will not.`,
        `The {lang} era. Some survived. Most did not.`,
    ],
}

const README_BANK = {
    missing: [
        `The README situation is nonexistent. The code screams into the void. The void has questions.`,
        `Zero READMEs detected. Strangers who clone these repos are filing for emotional damages.`,
        `The top repo has no README. Instructions: figure it out. Support: good luck.`,
    ],
    empty: [
        `The README exists. It contains a title and a prayer. That's it.`,
        `README quality: technically present. Actually useful: absolutely not.`,
        `The README is there the way a scarecrow is there — present but not doing the job.`,
    ],
    exists: [
        `The README actually has content. You're already in the top 40% of GitHub.`,
        `Someone wrote a README with actual information. Heroic.`,
    ],
}

const CLOSER_BANK = {
    catastrophic: [
        `In conclusion: @{u}'s GitHub is a masterclass in starting things. Finishing them is a Phase 2 feature that never shipped.`,
        `The GitHub: roasted. The developer: hopefully still coding. Somewhere. Eventually.`,
        `This isn't a portfolio. It's a monument to human potential and its complete failure to ship.`,
        `@{u} codes like they have infinite time and zero deadlines. GitHub disagrees with both.`,
    ],
    rough: [
        `There's potential here, buried under {abandoned} abandoned repos and creative commit messages. It's in there somewhere.`,
        `@{u} is one focused month away from a decent GitHub. That month has not yet arrived.`,
        `The code is in there. The commitment is not. The pun is intended.`,
        `With effort, @{u} could be dangerous. With current effort, the repos are the only ones in danger.`,
    ],
    mediocre: [
        `@{u} is not the worst developer on GitHub. That's the nicest thing we can say.`,
        `Somewhere between "just started" and "has it together" lives @{u}'s GitHub. Forever.`,
        `@{u} has achieved the rare equilibrium of mediocrity. Consistent at least.`,
    ],
    decent: [
        `@{u} is doing fine. "Fine" is the most haunting word in software development.`,
        `Better than most. Still here. Still roastable. Still @{u}.`,
        `Not bad. Not great. A solid B- in the university of GitHub.`,
    ],
    respectable: [
        `@{u} wins the prize for "most embarrassing repo on an otherwise decent profile." It knows which one.`,
        `Clean GitHub. One chaos repo in the corner giving everything away. You know the one.`,
        `@{u} has earned a respectful roast. The GitHub is good. The early repos are not.`,
    ],
}

// ─── Helper: pick random item from array ─────────────────
// WHY: variety across roasts — same profile = different text
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Helper: fill template placeholders ──────────────────
// WHY: templates use {u}, {count}, {pct} etc.
//      this replaces them with real values
function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// ─── Helper: get tier from score ─────────────────────────
function getTier(score) {
    if (score <= 25) return 'catastrophic'
    if (score <= 40) return 'rough'
    if (score <= 60) return 'mediocre'
    if (score <= 80) return 'decent'
    return 'respectable'
}

// ─── Helper: get commit shame score ──────────────────────
function getCommitShame(commitAnalysis) {
    return 100 - (commitAnalysis?.qualityScore ?? 50)
}

// ─── Section builders ─────────────────────────────────────
// WHY separate builders: each section handles one roast angle
//     combine them to build full roast paragraph

function buildOpener(username, score) {
    const tier = getTier(score)
    const template = pick(OPENER_BANK[tier])
    return fill(template, { u: username })
}

function buildAbandonSection(repoAnalysis) {
    if (!repoAnalysis || repoAnalysis.abandonedCount === 0) return ''
    const template = pick(ABANDON_BANK)
    return fill(template, {
        count: repoAnalysis.abandonedCount,
        pct: repoAnalysis.abandonedPct,
    })
}

function buildCommitSection(commitAnalysis) {
    if (!commitAnalysis || commitAnalysis.total === 0) return ''

    const shameScore = getCommitShame(commitAnalysis)
    const tier = shameScore > 70 ? 'horrible'
        : shameScore > 40 ? 'bad'
            : 'acceptable'

    // WHY: pick a real commit message to quote if available
    const sample = commitAnalysis.shameList?.[0]
        || commitAnalysis.shameList?.[1]
        || 'initial commit'

    const template = pick(COMMIT_BANK[tier])
    return fill(template, { sample })
}

function buildLanguageSection(raw) {
    if (!raw?.topLanguage || raw.topLanguage === 'Nothing') return ''

    const lang = raw.topLanguage
    const templates = LANGUAGE_BANK[lang] || LANGUAGE_BANK.default
    const template = pick(templates)
    return fill(template, { lang, year: new Date().getFullYear() })
}

function buildReadmeSection(readme) {
    if (!readme) return ''

    if (!readme.exists) return pick(README_BANK.missing)
    if (readme.isEmpty) return pick(README_BANK.empty)
    return pick(README_BANK.exists)
}

function buildCloser(username, score, repoAnalysis) {
    const tier = getTier(score)
    const template = pick(CLOSER_BANK[tier])
    return fill(template, {
        u: username,
        abandoned: repoAnalysis?.abandonedCount ?? 0,
    })
}

// ─── MAIN EXPORT: generateRoast ──────────────────────────
// WHY: assembles all sections into one cohesive roast
//      called by the route after GitHub analysis
//
// data shape (from githubService.analyzeProfile):
//   username, score, _raw, repoAnalysis, commitAnalysis, readme
function generateRoast(data) {
    const {
        username,
        score,
        _raw,
        repoAnalysis,
        commitAnalysis,
        readme,
    } = data

    // ── Build each section ────────────────────────────────
    const opener = buildOpener(username, score)
    const abandon = buildAbandonSection(repoAnalysis)
    const commits = buildCommitSection(commitAnalysis)
    const language = buildLanguageSection(_raw)
    const readmeS = buildReadmeSection(readme)
    const closer = buildCloser(username, score, repoAnalysis)

    // ── Assemble: filter empty sections, join with spaces ─
    // WHY filter: some sections may be empty (no commits found etc.)
    //     joining empty strings creates double spaces
    const sections = [opener, abandon, commits, language, readmeS, closer]
        .filter(s => s && s.trim().length > 0)

    // WHY: limit to 4 sections max — roast should be punchy
    //      not a 500-word essay
    const selected = sections.length > 4
        ? [sections[0], ...pickN(sections.slice(1, -1), 2), sections[sections.length - 1]]
        : sections

    return selected.join(' ')
}

// ─── Helper: pick N random items from array ───────────────
function pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n)
}

module.exports = { generateRoast }