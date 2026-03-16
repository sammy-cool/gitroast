// ============================================================
// GITROAST — Rule-Based Roast Engine (FREE TIER)
// WHY brutal: free users get ONE roast
//             it must be savage enough to share immediately
//             sharing = viral growth = more users
//             "too funny not to send to my dev friends" = our goal
// ============================================================

// ─── OPENER BANK ─────────────────────────────────────────
// WHY: first sentence sets the tone
//      must land hard enough that user keeps reading

const OPENER_BANK = {

    // Score 1-25: absolute disaster
    catastrophic: [
        `If giving up were a programming language, this GitHub would be running in production.`,
        `This is less a developer portfolio and more a support group for ideas that never made it past the README.`,
        `Somewhere between "I watched a tutorial once" and "I have a GitHub account" lives this profile.`,
        `This GitHub is what happens when ambition and follow-through have never been in the same room.`,
        `Looking at this profile, it's unclear whether the developer codes or just collects repositories the way others collect dust.`,
        `The only thing more impressive than the number of repos here is how few of them have a second commit.`,
    ],

    // Score 26-40: trying but failing spectacularly
    rough: [
        `There are developers who ship, developers who learn, and then there's whatever category this GitHub represents.`,
        `This profile has the energy of someone who buys a guitar, learns one chord, and lists "musician" on their CV.`,
        `Started strong, committed once, disappeared for three months — repeat for every single repo in here.`,
        `The git history reads like someone discovered coding, got excited for a weekend, and then rediscovered television.`,
        `This GitHub is a masterclass in one specific skill: writing "initial commit" with absolute confidence and never returning.`,
        `Calling this a developer portfolio is generous. It's more of a museum of good intentions.`,
    ],

    // Score 41-60: mediocre, comfortably so
    mediocre: [
        `This GitHub is the coding equivalent of "I work better under pressure" — the pressure has never actually arrived.`,
        `Not the worst GitHub ever seen. That is the nicest sentence this profile has earned.`,
        `Technically a developer. The repos are technically projects. Everything here is technically something.`,
        `This profile exists in the uncanny valley between "just started learning" and "ships things" — permanently.`,
        `The commits suggest someone who treats deadlines the way cats treat closed doors: aware they exist, deeply unbothered.`,
        `There is coding happening here. Whether it is going anywhere is a question the commit history refuses to answer.`,
    ],

    // Score 61-80: decent but still roastable
    decent: [
        `A better-than-average GitHub, which in this industry is a low bar that this profile clears by about an inch.`,
        `Genuinely not bad. Which means we had to dig, but the ammunition was absolutely still there.`,
        `This developer ships things occasionally, which puts them ahead of most — and still firmly in roasting territory.`,
        `The GitHub is decent. The early repos are a time capsule nobody asked to open.`,
        `Respectable output, genuinely. The commit messages from the first two years are less respectable.`,
    ],

    // Score 81-99: actually good but humor still needed
    respectable: [
        `A legitimately good GitHub, which somehow makes roasting it more fun.`,
        `This developer actually maintains their repos. Suspicious. We looked harder.`,
        `One of the better profiles we have seen today, which is why we are going after the specifics.`,
        `Good overall. The chaos is subtle. But it is absolutely there.`,
    ],
}

// ─── ABANDON BANK ────────────────────────────────────────
// WHY: abandoned repos are the #1 roastable signal
//      every developer relates — this gets shared

const ABANDON_BANK = [
    `There are {count} repos here with a single commit that says "initial setup" — which is either a development strategy or a coping mechanism.`,
    `{count} projects started, {count} projects exist as monuments to the exact moment motivation checked out.`,
    `The abandonment rate is {pct}%, which is less a statistic and more a lifestyle documented in git history.`,
    `{count} repos never made it past the scaffolding phase, which means this developer is exceptionally good at starting things in the same way a car alarm is exceptionally good at being heard.`,
    `Started {count} separate projects. Finished zero. But the folder structure on each one was immaculate.`,
    `{pct}% of these repos have been left mid-sentence, which is technically a consistent narrative voice.`,
    `There are {count} initial commits here with no follow-up, each one a tiny gravestone that reads "I had an idea once."`,
    `{count} repos that peaked at creation day and quietly decided that was the whole arc.`,
]

// ─── COMMIT BANK ─────────────────────────────────────────
// WHY: commit messages are deeply personal and universally relatable
//      quoting the actual messages gets screenshots every time

const COMMIT_BANK = {
    horrible: [
        `The commit history reads like a person typing with one hand and spiralling with the other — "{sample}" is a real entry that exists in this codebase unedited.`,
        `Someone pushed "{sample}" to a repository that other human beings could potentially see, and then apparently felt fine about it.`,
        `The git log contains "{sample}" with the same energy someone puts a sticky note saying "fix later" on a structural wall.`,
        `"{sample}" appears in the commit history here, which is not a commit message so much as a cry for help formatted as version control.`,
        `Future developers inheriting this codebase will find "{sample}" in the log and have to make a decision about their career.`,
        `The commit messages have the specificity of a doctor's note written by someone who does not want to explain anything — see: "{sample}".`,
    ],
    bad: [
        `Not the worst commit history, but "{sample}" is doing significant damage to that claim.`,
        `The commits are descriptive in the same way that "{sample}" is descriptive — technically words were written.`,
        `Someone typed "{sample}", hit enter, and pushed to main. That person is this developer. That commit is still there.`,
        `The git history suggests someone who treats commit messages like voicemails: left quickly, never reviewed, "{sample}".`,
    ],
    acceptable: [
        `Mostly coherent commits, with "{sample}" appearing occasionally to remind everyone that nobody is perfect.`,
        `Decent commit hygiene overall. "{sample}" shows up now and then like an old habit that never fully left.`,
    ],
}

// ─── LANGUAGE BANK ───────────────────────────────────────
const LANGUAGE_BANK = {
    PHP: [
        `The primary language is PHP, which in ${new Date().getFullYear()} is either a brave choice or a very specific form of brand loyalty to the early 2000s.`,
        `Still writing PHP in ${new Date().getFullYear()}. At this point it is less a language choice and more a personality trait that nobody asked about.`,
        `The top language is PHP, which explains some things about the commit history and raises new questions about the life choices.`,
    ],
    JavaScript: [
        `All JavaScript, which means there is a node_modules folder somewhere on this machine that weighs more than the developer's ambitions.`,
        `Full JavaScript stack — the repos multiply, the npm installs accumulate, the shipped products remain a vision board item.`,
        `JavaScript everywhere, including three repos that are essentially the same project started again after the last one became emotionally difficult.`,
    ],
    Python: [
        `Primary language Python, which is great for getting started and apparently less useful for the part that comes after getting started.`,
        `Python developer. The scripts are clean. The deployment pipeline is a spiritual concept.`,
        `Mostly Python repos, each one beginning with confidence and ending somewhere around "TODO: finish this."`,
    ],
    Java: [
        `Java as the main language, which means there are AbstractFactoryManagerBean files in here that have never been opened by another human.`,
        `Writing Java in ${new Date().getFullYear()}, which means the code compiles, the README does not exist, and the verbosity is impeccable.`,
        `Java developer. The code is enterprise-grade. The follow-through is startup-grade. They cancel each other out.`,
    ],
    TypeScript: [
        `TypeScript purist — the types are strictly enforced, the deadlines are loosely interpreted, and type: any appears in three repos anyway.`,
        `Full TypeScript stack, because if the project is going to be unfinished, it should at least fail to compile with full type safety.`,
        `TypeScript everywhere. Has definitely judged someone for using JavaScript this week. The repos are still undeployed.`,
    ],
    Rust: [
        `Writing Rust, which means the memory is safe, the borrow checker is satisfied, and the number of shipped projects is zero — but safely zero.`,
        `Rust main language. Has mentioned memory safety in conversation without being asked. The GitHub confirms the personality.`,
        `Rust developer. Technically impressive. The repos are the safest unfinished projects on this platform.`,
    ],
    'C++': [
        `C++ as the primary language, which means memory is managed manually and projects are not managed at all.`,
        `Writing C++ in ${new Date().getFullYear()} with the confidence of someone who enjoys doing things the hard way including finishing them.`,
        `C++ developer. The segmentation faults are handled. The project completion rate is not.`,
    ],
    CSS: [
        `CSS is somehow the primary language here, which means the buttons are centered and nothing else is.`,
        `CSS main language — the flexbox is aligned, the grid is laid out, and the JavaScript that would make any of it functional is a future problem.`,
    ],
    default: [
        `Primary language {lang} — a choice made, committed to, and surrounded by {lang} repos that peaked at scaffold.`,
        `Mostly {lang}, which is fine. The {lang} repos that never got past day one are less fine.`,
        `The {lang} era is well-documented here. The shipping era remains in early access.`,
    ],
}

// ─── README BANK ─────────────────────────────────────────
const README_BANK = {
    missing: [
        `The top repo has no README, which is a strong statement that the code is either self-explanatory or completely inexplicable — and one of those is more likely.`,
        `Zero documentation anywhere near the main project, which means this is open source in the same way a locked room is open — technically accessible with the right tools and zero help.`,
        `No README on the top repo. The code is out there. What it does, why it exists, how to run it — these are mysteries the developer has left for others to solve.`,
    ],
    empty: [
        `The README exists. It has a project name. That is where the documentation journey ends and the user's suffering begins.`,
        `There is a README in the top repo. It contains a title and the faint implication that more words were once planned.`,
        `The README is technically present in the same way a closed sign is technically communication.`,
    ],
    exists: [
        `Actually wrote documentation with real information in it, which is statistically remarkable and personally admirable.`,
        `The README has actual content, putting this profile ahead of roughly 70% of public GitHub repositories.`,
    ],
}

// ─── CLOSER BANK ─────────────────────────────────────────
// WHY: the closer is what gets screenshotted and shared
//      must land hard, be memorable, tie the whole roast together

const CLOSER_BANK = {
    catastrophic: [
        `In conclusion: the repos exist, the commits happened, and the finished products are a rumour.`,
        `This is not a developer portfolio. It is a detailed public record of every time enthusiasm lasted one weekend.`,
        `The GitHub tells a complete story — the beginning is always "initial commit" and the ending is always silence.`,
        `Every single repo here is a chapter in the same book, and every chapter ends on a cliffhanger that nobody came back to resolve.`,
        `This GitHub has the commitment to starting things that most people reserve for quitting them.`,
        `The code is out there. The follow-through is not. The ratio speaks volumes and not one of those volumes is finished.`,
    ],
    rough: [
        `One focused month away from a decent GitHub. That month has been rescheduled several times.`,
        `There is a good developer in here somewhere, surrounded by {abandoned} repos that never found out.`,
        `The potential is real. The evidence of that potential being acted on is more of a personal best effort situation.`,
        `Ships nothing, starts everything, describes themselves as "passionate about coding" — the full experience.`,
        `This developer is one deadline away from greatness and appears to have no deadlines.`,
    ],
    mediocre: [
        `Not the worst GitHub on the internet. A claim that requires zero additional context to be the most honest thing said today.`,
        `Exists. Commits. Continues. A triumphant journey with no particular destination.`,
        `Aggressively, persistently, professionally average — which in fairness is harder to maintain than either extreme.`,
        `A GitHub in perfect equilibrium: equal parts started and abandoned, equal parts ambitious and done for today.`,
    ],
    decent: [
        `Doing fine overall. Fine is the most haunting word in software development and it fits here precisely.`,
        `Not bad. Not great. A solid B- in the ongoing assessment of putting things on the internet and occasionally finishing them.`,
        `Better than average, which still leaves plenty of room for this to have been written.`,
        `The {lang} repos are decent. The ones from three years ago are why we are all here today.`,
    ],
    respectable: [
        `A good developer with a good GitHub and at least one repo that explains why this roast exists.`,
        `Legitimately solid output — the chaos is in the details, and the details were found.`,
        `The current profile is genuinely respectable. The early commit messages are not, and they never will be.`,
        `Good GitHub. One chaos repo in the corner making eye contact. Both parties aware.`,
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
    return pick(OPENER_BANK[getTier(score)])
}

function buildAbandonSection(repoAnalysis) {
    if (!repoAnalysis || repoAnalysis.abandonedCount < 2) return ''
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
    const sample = commitAnalysis.shameList?.[0] || 'pls work'
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
    return fill(pick(CLOSER_BANK[getTier(score)]), {
        abandoned: repoAnalysis?.abandonedCount ?? 0,
        lang: _raw?.topLanguage || 'JavaScript',
    })
}

// ─── MAIN EXPORT ─────────────────────────────────────────
// WHY structure: opener → 2 specific punches → closer
//     opener sets the vibe
//     middle sections hit specific evidence
//     closer is the punchline that gets shared
function generateRoast(data) {
    const { score, _raw, repoAnalysis, commitAnalysis, readme } = data

    const opener = buildOpener(score)
    const closer = buildCloser(score, repoAnalysis, _raw)

    // WHY: build all possible middle sections then pick best 2
    const middles = [
        buildAbandonSection(repoAnalysis),
        buildCommitSection(commitAnalysis),
        buildLanguageSection(_raw),
        buildReadmeSection(readme),
    ].filter(s => s && s.trim().length > 0)

    // WHY: always opener + 2 middle punches + closer = 4 sentences
    //      4 sentences = readable, shareable, punchy
    //      more than 4 = essay, less than 4 = incomplete
    const selected = [
        opener,
        ...pickN(middles, Math.min(2, middles.length)),
        closer,
    ].filter(Boolean)

    return selected.join(' ')
}

module.exports = { generateRoast }