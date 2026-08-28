// WHY: built-in fetch is available in Node 18+
//      zero extra dependency needed
const BASE_URL = "https://api.github.com";

// WHY: shared headers for every GitHub request
//      Accept header tells GitHub we want v3 API JSON
//      Authorization uses token if available (optional for public)
// WHY userToken param: Pro users pass their own GitHub token
//     gives access to their private repos
function getHeaders(userToken = null) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitRoast-App",
  };

  // WHY: Pro user's token takes priority over server token
  const token = userToken || process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  return headers;
}

// ─── Helper: safe GitHub fetch ────────────────────────────
// WHY: centralizes error handling for every GitHub API call
//      so we don't repeat try/catch everywhere
// WHY userToken: thread through every fetch call
async function githubFetch(endpoint, userToken = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(userToken),
    signal: AbortSignal.timeout(8000),
  });

  // WHY: check rate limit before throwing
  if (res.status === 403) {
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
  }

  // WHY: 404 means user doesn't exist on GitHub
  if (res.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!res.ok) {
    throw new Error(`GITHUB_API_ERROR_${res.status}`);
  }

  return res.json();
}

// ─── 1. Fetch user profile ────────────────────────────────
// WHY: gives us name, bio, followers, public_repos, created_at
async function fetchProfile(username, userToken) {
  return githubFetch(`/users/${username}`, userToken);
}

// ─── 2. Fetch repositories ───────────────────────────────
// WHY sort=pushed: most recently active repos first
//     per_page=100: get as many as possible in one call
async function fetchRepos(username, userToken) {
  // WHY: Pro users get private repos with 'affiliation' param
  const endpoint = userToken
    ? `/user/repos?sort=pushed&per_page=100&visibility=all`
    : `/users/${username}/repos?sort=pushed&per_page=100&type=public`;
  return githubFetch(endpoint, userToken);
}

// ─── 3. Fetch recent commits from most active repo ────────
// WHY: we want real commit messages to roast
//      we pick the most recently pushed repo for best results
async function fetchRecentCommits(username, repos, userToken) {
  // WHY: filter out forks — we want THEIR commits not copied ones
  const ownRepos = repos.filter((r) => !r.fork);

  if (ownRepos.length === 0) return [];

  // WHY: pick the most recently pushed repo
  const mostActive = ownRepos[0];

  try {
    const commits = await githubFetch(
      `/repos/${username}/${mostActive.name}/commits?per_page=15`,
      userToken,
    );
    // WHY: extract just the message, trim whitespace
    return commits
      .map((c) => c.commit?.message?.split("\n")[0]?.trim())
      .filter(Boolean); // remove any undefined/empty
  } catch {
    // WHY: commits endpoint can fail on empty repos — that's fine
    return [];
  }
}

// ─── 4. Check README quality ─────────────────────────────
// WHY: a missing or tiny README is prime roast material
async function checkReadmeQuality(username, repos, userToken) {
  // WHY: check the most starred repo for README
  const sorted = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  const topRepo = sorted[0];

  if (!topRepo) return { exists: false, length: 0 };

  try {
    const readme = await githubFetch(
      `/repos/${username}/${topRepo.name}/readme`,
      userToken,
    );
    // WHY: readme content is base64 encoded by GitHub
    const content = Buffer.from(readme.content, "base64").toString("utf-8");
    return {
      exists: true,
      length: content.length,
      // WHY: under 200 chars = basically empty
      isEmpty: content.length < 200,
      repoName: topRepo.name,
    };
  } catch {
    // WHY: no readme = 404 from GitHub, we catch and return empty
    return { exists: false, length: 0, isEmpty: true, repoName: topRepo?.name };
  }
}

// ─── 5. Analyze repositories ─────────────────────────────
// WHY: extract roastable signals from repo list
function analyzeRepos(repos) {
  const ownRepos = repos.filter((r) => !r.fork);
  const totalOwn = ownRepos.length;

  // WHY: repos with zero commits after creation = abandoned
  //      we use pushed_at vs created_at as proxy
  const abandoned = ownRepos.filter((r) => {
    const created = new Date(r.created_at);
    const pushed = new Date(r.pushed_at);
    const daysDiff = (pushed - created) / (1000 * 60 * 60 * 24);
    // WHY: pushed within 1 day of creation = likely abandoned
    return daysDiff < 1;
  });

  // WHY: language frequency map → find dominant language
  const languageMap = {};
  ownRepos.forEach((r) => {
    if (r.language) {
      languageMap[r.language] = (languageMap[r.language] || 0) + 1;
    }
  });

  // Sort languages by count
  const languages = Object.entries(languageMap)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  // WHY: repos with no description = lazy developer
  const noDescription = ownRepos.filter((r) => !r.description).length;

  // WHY: total stars across all repos
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

  return {
    totalOwn,
    totalForks: repos.length - totalOwn,
    abandonedCount: abandoned.length,
    abandonedPct:
      totalOwn > 0 ? Math.round((abandoned.length / totalOwn) * 100) : 0,
    languages,
    topLanguage: languages[0] || "Nothing",
    noDescription,
    totalStars,
  };
}

// ─── 6. Analyze commit messages ──────────────────────────
// WHY: find the most roastable commit patterns
function analyzeCommits(commits) {
  if (commits.length === 0) {
    return {
      total: 0,
      shameList: [],
      qualityScore: 0,
    };
  }

  // WHY: these patterns = bad commit messages
  const shamePatterns = [
    /fix/i,
    /fixed/i,
    /wip/i,
    /test/i,
    /asdf/i,
    /aaa+/i,
    /lol/i,
    /idk/i,
    /pls/i,
    /please/i,
    /final/i,
    /last/i,
    /real/i,
    /ok$/i,
    /done/i,
    /stuff/i,
    /things/i,
    /update/i,
    /changes/i,
    /commit/i,
    /work/i,
    /trying/i,
    /help/i,
  ];

  const shameCommits = commits.filter((msg) =>
    shamePatterns.some((p) => p.test(msg)),
  );

  // WHY: quality score = % of NON-shame commits
  const qualityScore = Math.round(
    ((commits.length - shameCommits.length) / commits.length) * 100,
  );

  return {
    total: commits.length,
    // WHY: top 5 most shameful for display
    shameList: shameCommits.slice(0, 5),
    qualityScore,
  };
}

// ─── 7. Calculate join year ──────────────────────────────
function getJoinYear(profile) {
  return new Date(profile.created_at).getFullYear();
}

// ─── 8. Calculate roast score (0-100, lower = worse) ─────
// WHY: this is the headline number on the card
//      combines multiple signals into one score
function calculateRoastScore(repoAnalysis, commitAnalysis, readme) {
  let score = 100;

  // Abandoned repos penalty (max -35)
  score -= Math.min(35, Math.round(repoAnalysis.abandonedPct * 0.35));

  // Commit quality penalty (max -30)
  const commitPenalty = 100 - commitAnalysis.qualityScore;
  score -= Math.round(commitPenalty * 0.3);

  // README penalty (max -20)
  if (!readme.exists) score -= 20;
  else if (readme.isEmpty) score -= 12;

  // No descriptions penalty (max -15)
  const descPenalty =
    repoAnalysis.totalOwn > 0
      ? repoAnalysis.noDescription / repoAnalysis.totalOwn
      : 0;
  score -= Math.round(descPenalty * 15);

  // WHY: clamp between 1-99 — 0 and 100 are too absolute
  return Math.max(1, Math.min(99, score));
}

// ─── 9. Calculate grade from score ───────────────────────
function getGrade(score) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  if (score >= 25) return "F";
  return "F-";
}

// ─── MAIN EXPORT: Full profile analysis ──────────────────
// WHY: one function call → everything about a user
//      called by the route, returns clean structured data
async function analyzeProfile(username, userToken = null) {
  // WHY Promise.all: fetch profile + repos at the SAME TIME
  //     instead of waiting for each one. Saves ~500ms.
  const [profile, repos] = await Promise.all([
    fetchProfile(username, userToken),
    fetchRepos(username, userToken),
  ]);

  // WHY: these depend on repos so they run after
  const [commits, readme] = await Promise.all([
    fetchRecentCommits(username, repos, userToken),
    checkReadmeQuality(username, repos, userToken),
  ]);

  const repoAnalysis = analyzeRepos(repos);
  const commitAnalysis = analyzeCommits(commits);
  const score = calculateRoastScore(repoAnalysis, commitAnalysis, readme);
  const grade = getGrade(score);

  // WHY: build stats array in the exact shape our StatsGrid expects
  const stats = [
    {
      label: "Commit Quality",
      value: `${commitAnalysis.qualityScore}%`,
      bad: commitAnalysis.qualityScore < 50,
      note:
        commitAnalysis.qualityScore < 30
          ? "Below panic threshold"
          : commitAnalysis.qualityScore < 60
            ? "Room for improvement"
            : "Not bad actually",
    },
    {
      label: "README Score",
      value: readme.exists ? (readme.isEmpty ? "8%" : "72%") : "0%",
      bad: !readme.exists || readme.isEmpty,
      note: !readme.exists
        ? "Does not exist"
        : readme.isEmpty
          ? "Technically exists"
          : "Actually has content",
    },
    {
      label: "Repo Survival",
      value: `${100 - repoAnalysis.abandonedPct}%`,
      bad: repoAnalysis.abandonedPct > 50,
      note: `${repoAnalysis.abandonedCount} of ${repoAnalysis.totalOwn} abandoned`,
    },
    {
      label: "Shame Index",
      value: `${100 - commitAnalysis.qualityScore}%`,
      bad: true,
      note:
        repoAnalysis.topLanguage !== "Nothing"
          ? `${repoAnalysis.topLanguage} still in prod`
          : "No code found",
    },
  ];

  // WHY: return clean shape — matches exactly what RoastCard expects
  return {
    username,
    score,
    grade,
    joinYear: getJoinYear(profile),
    totalRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    location: profile.location,
    shameCommits: commitAnalysis.shameList,
    stats,
    repoAnalysis,
    commitAnalysis,
    readme,
    // WHY: raw data passed to roast engine in Phase 4
    _raw: {
      topLanguage: repoAnalysis.topLanguage,
      languages: repoAnalysis.languages,
      abandonedCount: repoAnalysis.abandonedCount,
      totalOwn: repoAnalysis.totalOwn,
      commitQuality: commitAnalysis.qualityScore,
      hasReadme: readme.exists,
      totalStars: repoAnalysis.totalStars,
    },
  };
}

module.exports = { analyzeProfile };
