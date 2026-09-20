// ============================================================
// GITROAST — Tech Giants / Company Wall of Shame Service
// ============================================================
// WHAT: Curated company roasts and chaos rankings for major tech giants.
// WHY:
//   - High social virality (developers love seeing FAANG roasted).
//   - Drives debates on Twitter / Reddit ("Google got an F, Spotify got a C").
//   - Zero GitHub API rate-limit burn for high-traffic public browsing.
// ============================================================

const TECH_GIANTS = [
  {
    org: "google",
    name: "Google",
    tagline: "Billions of lines of monorepo code, still haven't finished the Angular migration.",
    chaosScore: 28,
    grade: "F",
    sins: ["Deprecated 280+ APIs", "4 different chat apps in commit history", "Graveyard of killed products"],
    employeesRoasted: "182,000+",
  },
  {
    org: "meta",
    name: "Meta",
    tagline: "Move fast and break things — especially the merge conflict resolution.",
    chaosScore: 32,
    grade: "F",
    sins: ["PHP still lurks deep in production", "$40B spent on legless metaverse avatars", "Broke WhatsApp privacy notices 6 times"],
    employeesRoasted: "67,000+",
  },
  {
    org: "microsoft",
    name: "Microsoft",
    tagline: "Owns GitHub, yet Windows Update still interrupts you mid-git-push.",
    chaosScore: 38,
    grade: "D",
    sins: ["Replaced every single button with Copilot", "Active Directory trauma", "Teams consumes 6GB RAM sitting idle"],
    employeesRoasted: "220,000+",
  },
  {
    org: "netflix",
    name: "Netflix",
    tagline: "Chaos Monkey deleted their production database and they called it an architectural pattern.",
    chaosScore: 41,
    grade: "D",
    sins: ["Cancelled your favorite series mid-deploy", "Password sharing blocker PR merged", "Microservices calling microservices in circles"],
    employeesRoasted: "13,000+",
  },
  {
    org: "vercel",
    name: "Vercel",
    tagline: "Deploys in 10 seconds, spins down in 10 minutes, charges enterprise tier for a console.log.",
    chaosScore: 44,
    grade: "D",
    sins: ["Invented 6 ways to fetch data in 3 years", "Edge middleware cold start excuses", "Next.js cache invalidation wizardry"],
    employeesRoasted: "500+",
  },
  {
    org: "apple",
    name: "Apple",
    tagline: "Charges $99/year for a dev certificate and rejects your app because an icon corner was off by 1px.",
    chaosScore: 35,
    grade: "F",
    sins: ["$29 dongle required to clone repo", "Xcode takes 45GB and 3 business days to install", "WebKit holding back web standards"],
    employeesRoasted: "160,000+",
  },
  {
    org: "amazon",
    name: "Amazon AWS",
    tagline: "9,000 services with identical names, none of which anyone knows how to safely delete.",
    chaosScore: 30,
    grade: "F",
    sins: ["$4,000 surprise bill for orphaned NAT gateway", "IAM policy docs longer than War and Peace", "Two-pizza team burnout"],
    employeesRoasted: "1,500,000+",
  },
  {
    org: "uber",
    name: "Uber",
    tagline: "Surge pricing for resolving git merge conflicts at 2 AM.",
    chaosScore: 42,
    grade: "D",
    sins: ["Rewrote entire stack in Go every 18 months", "Kafka clusters larger than small nations", "Rerouting around production bugs"],
    employeesRoasted: "32,000+",
  },
  {
    org: "airbnb",
    name: "Airbnb",
    tagline: "Created the world's strictest ESLint config, but still charges a $250 cleaning fee on PRs.",
    chaosScore: 45,
    grade: "C",
    sins: ["Banned all semicolons in 2017", "Checkout button has 14 hidden fees", "Unused CSS cleanup took 4 years"],
    employeesRoasted: "6,800+",
  },
  {
    org: "spotify",
    name: "Spotify",
    tagline: "Invented Squads, Tribes, and Guilds — still shuffles the same 4 songs on repeat.",
    chaosScore: 46,
    grade: "C",
    sins: ["Desktop app is an Electron memory hog", "Agile model that even Spotify gave up on", "Redesigned podcast UI every Tuesday"],
    employeesRoasted: "9,000+",
  },
];

function getCompanyLeaderboard() {
  return TECH_GIANTS.map((company, index) => ({
    rank: index + 1,
    org: company.org,
    name: company.name,
    tagline: company.tagline,
    chaosScore: company.chaosScore,
    grade: company.grade,
    avatarUrl: `https://avatars.githubusercontent.com/${company.org}?s=96`,
    sins: company.sins,
    employeesRoasted: company.employeesRoasted,
  }));
}

module.exports = { getCompanyLeaderboard };
