const BASE_URL = "https://api.github.com";

const { defaultWrappedYear } = require("../utils/constants");

function getHeaders(userToken = null) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitRoast-App",
  };

  const token = userToken || process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  return headers;
}

async function githubFetch(endpoint, userToken = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(userToken),
    signal: AbortSignal.timeout(20000),
  });

  if (res.status === 403) {
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0" || res.headers.get("retry-after")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    const bodyText = await res.text().catch(() => "");
    if (bodyText.includes("rate limit") || bodyText.includes("secondary rate limit")) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  if (res.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!res.ok) {
    throw new Error(`GITHUB_API_ERROR_${res.status}`);
  }

  return res.json();
}

async function fetchProfile(username, userToken) {
  return githubFetch(`/users/${encodeURIComponent(username)}`, userToken);
}

async function fetchRepos(username, userToken = null, isOwnProfileAndPro = false) {
  const endpoint = isOwnProfileAndPro
    ? `/user/repos?sort=pushed&per_page=100&visibility=all`
    : `/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=100&type=public`;
  return githubFetch(endpoint, userToken);
}

async function fetchRecentCommits(username, repos, userToken) {
  const ownRepos = repos.filter((r) => !r.fork);

  if (ownRepos.length === 0) return [];

  const mostActive = ownRepos[0];

  try {
    const commits = await githubFetch(
      `/repos/${encodeURIComponent(username)}/${encodeURIComponent(mostActive.name)}/commits?per_page=15`,
      userToken,
    );
    if (!Array.isArray(commits)) {
      return [];
    }
    return commits
      .map((c) => c.commit?.message?.split("\n")[0]?.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function checkReadmeQuality(username, repos, userToken) {
  const ownRepos = (repos || []).filter((r) => !r.fork);
  const candidates = ownRepos.length > 0 ? ownRepos : (repos || []);
  const sorted = [...candidates].sort(
    (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0),
  );
  const topRepo = sorted[0];

  if (!topRepo) return { exists: false, length: 0 };

  try {
    const readme = await githubFetch(
      `/repos/${encodeURIComponent(username)}/${encodeURIComponent(topRepo.name)}/readme`,
      userToken,
    );
    const content = Buffer.from(readme.content, "base64").toString("utf-8");
    return {
      exists: true,
      length: content.length,
      isEmpty: content.length < 200,
      repoName: topRepo.name,
    };
  } catch {
    return { exists: false, length: 0, isEmpty: true, repoName: topRepo?.name };
  }
}

function analyzeRepos(repos) {
  const safeRepos = Array.isArray(repos) ? repos : [];
  const ownRepos = safeRepos.filter((r) => !r.fork);
  const totalOwn = ownRepos.length;

  const abandoned = ownRepos.filter((r) => {
    const created = new Date(r.created_at);
    const pushed = new Date(r.pushed_at);
    const daysDiff = (pushed - created) / (1000 * 60 * 60 * 24);
    return daysDiff < 1;
  });

  const languageMap = {};
  ownRepos.forEach((r) => {
    if (r.language) {
      languageMap[r.language] = (languageMap[r.language] || 0) + 1;
    }
  });

  const languages = Object.entries(languageMap)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  const noDescription = ownRepos.filter((r) => !r.description).length;

  const totalStars = ownRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  return {
    totalOwn,
    totalForks: safeRepos.length - totalOwn,
    abandonedCount: abandoned.length,
    abandonedPct:
      totalOwn > 0 ? Math.round((abandoned.length / totalOwn) * 100) : 0,
    languages,
    topLanguage: languages[0] || "Nothing",
    noDescription,
    totalStars,
  };
}

function analyzeCommits(commits) {
  if (commits.length === 0) {
    return {
      total: 0,
      shameList: [],
      qualityScore: 0,
    };
  }

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

  const qualityScore = Math.round(
    ((commits.length - shameCommits.length) / commits.length) * 100,
  );

  return {
    total: commits.length,
    shameList: shameCommits.slice(0, 5),
    qualityScore,
  };
}

function getJoinYear(profile) {
  return new Date(profile.created_at).getFullYear();
}

function calculateRoastScore(repoAnalysis, commitAnalysis, readme) {
  if (repoAnalysis.totalOwn === 0) {
    return 15;
  }

  let score = 100;

  score -= Math.min(35, Math.round(repoAnalysis.abandonedPct * 0.35));

  const commitPenalty = 100 - commitAnalysis.qualityScore;
  score -= Math.round(commitPenalty * 0.3);

  if (!readme.exists) score -= 20;
  else if (readme.isEmpty) score -= 12;

  const descPenalty =
    repoAnalysis.totalOwn > 0
      ? repoAnalysis.noDescription / repoAnalysis.totalOwn
      : 0;
  score -= Math.round(descPenalty * 15);

  return Math.max(1, Math.min(99, score));
}

function getGrade(score) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  if (score >= 25) return "F";
  return "F-";
}

function generateBioContrast(profile, repoAnalysis, commitAnalysis) {
  const bio = (profile.bio || "").trim();
  const lowerBio = bio.toLowerCase();

  let claimed = bio;
  let reality = "";
  let verdict = "";

  if (!bio) {
    claimed = "Stealth Mode Stealth Engineer";
    reality = `Zero bio provided. Profile holds ${repoAnalysis.totalOwn} repositories with ${repoAnalysis.totalStars} total stars.`;
    verdict = "LinkedIn: Visionary Builder | GitHub: Zero trace of code evidence";
  } else if (lowerBio.includes("full stack") || lowerBio.includes("fullstack")) {
    claimed = "Full-Stack Software Wizard";
    reality = `${repoAnalysis.topLanguage} heavy (${repoAnalysis.totalOwn} repos), with ${repoAnalysis.abandonedPct}% project abandonment rate.`;
    verdict = "Resume: End-to-end full stack developer | GitHub: Mostly frontend CSS debugging and forgotten repos";
  } else if (lowerBio.includes("senior") || lowerBio.includes("lead") || lowerBio.includes("architect")) {
    claimed = bio.length > 50 ? bio.slice(0, 47) + "..." : bio;
    const worstCommit = commitAnalysis.shameList[0] || "fix";
    reality = `Code hygiene rated at ${commitAnalysis.qualityScore}%. Top architectural commit: "${worstCommit}".`;
    verdict = "LinkedIn: Principal System Architect | GitHub: Pushing untested hotfixes straight to master";
  } else if (lowerBio.includes("ai") || lowerBio.includes("ml") || lowerBio.includes("machine learning") || lowerBio.includes("data")) {
    claimed = "AI / ML Pioneer";
    reality = "Imports numpy and scikit-learn once, followed by 12 commits of 'adjust hyperparameters pls'.";
    verdict = "Resume: Deep Learning Researcher | GitHub: Wrapper around OpenAI API keys";
  } else if (lowerBio.includes("open source") || lowerBio.includes("contributor") || lowerBio.includes("oss")) {
    claimed = "Open Source Evangelist";
    reality = `${repoAnalysis.totalForks} forks collected, but only ${repoAnalysis.totalStars} stars earned in return.`;
    verdict = "Resume: Active Open Source Core Contributor | GitHub: Typo fixes in README files";
  } else if (lowerBio.includes("student") || lowerBio.includes("learner") || lowerBio.includes("enthusiast")) {
    claimed = bio.length > 50 ? bio.slice(0, 47) + "..." : bio;
    reality = `${repoAnalysis.abandonedCount} tutorial repositories abandoned the moment the YouTube video ended.`;
    verdict = "Resume: Passionate Lifelong Learner | GitHub: Cemetery of incomplete clone tutorials";
  } else {
    claimed = bio.length > 50 ? bio.slice(0, 47) + "..." : bio;
    if (repoAnalysis.abandonedPct > 50) {
      reality = `${repoAnalysis.abandonedPct}% of projects abandoned within 24 hours of repo creation.`;
      verdict = "Resume: Results-Oriented Delivery Machine | GitHub: Repository Graveyard Caretaker";
    } else if (commitAnalysis.qualityScore < 45) {
      const worst = commitAnalysis.shameList[0] || "wip";
      reality = `Commit quality is ${commitAnalysis.qualityScore}%. Documented commit history includes "${worst}".`;
      verdict = "Resume: Clean Code & Best Practices | GitHub: 'git push --force' into production";
    } else {
      reality = `${repoAnalysis.totalStars} stars across ${repoAnalysis.totalOwn} repositories with ${repoAnalysis.topLanguage} stack.`;
      verdict = "Resume: Industry Impact Leader | GitHub: Well-hidden behind private organization repos";
    }
  }

  return {
    bio: bio || "No bio provided.",
    claimed,
    reality,
    verdict,
  };
}

// ── Collaboration evidence (public only, last 12 months) ─────────────
// Uses GitHub GraphQL (needs a token). Sums the PER-REPOSITORY contribution lists, which only
// contain public repositories, instead of the totals (which can include opted-in private activity).
const COLLAB_QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository { owner { login } }
        contributions { totalCount }
      }
      pullRequestReviewContributionsByRepository(maxRepositories: 100) {
        repository { owner { login } }
        contributions { totalCount }
      }
    }
  }
}`;

// Top public repositories by stars (own, non-fork) for the talent profile "Notable public projects".
function pickTopRepos(repos, n = 3) {
  return (repos || [])
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, n)
    .map((r) => ({
      name: String(r.name || "").slice(0, 100),
      stars: r.stargazers_count || 0,
      description: String(r.description || "").slice(0, 140),
      language: r.language || "",
    }));
}

// "Repository highlight": the strongest public repo plus one deterministic, kind-but-pointed line.
// Deterministic on purpose: no extra AI cost, same input gives the same card, and every claim is a fact.
function buildRepoHighlight(repos, now = Date.now()) {
  const own = (repos || []).filter((r) => r && !r.fork && r.name);
  if (!own.length) return null;
  const score = (r) => {
    const days = r.pushed_at ? (now - new Date(r.pushed_at).getTime()) / 864e5 : 9999;
    return (r.stargazers_count || 0) * 2 + (r.forks_count || 0) + (days < 90 ? 5 : 0) - (r.archived ? 50 : 0);
  };
  const best = [...own].sort((a, b) => score(b) - score(a))[0];
  const stars = best.stargazers_count || 0;
  const forks = best.forks_count || 0;
  const issues = best.open_issues_count || 0;
  const daysSincePush = best.pushed_at ? Math.max(0, Math.floor((now - new Date(best.pushed_at).getTime()) / 864e5)) : null;
  const description = String(best.description || "").slice(0, 160);
  const name = String(best.name).slice(0, 100);

  let quote;
  if (!description) quote = `${name} has ${stars} stars and no description. Mystery is a strategy.`;
  else if (daysSincePush !== null && daysSincePush > 365) quote = `${name} was last touched ${daysSincePush} days ago. The code is aging quietly, and so is its issue tracker.`;
  else if (issues > Math.max(10, stars)) quote = `${issues} open issues for ${stars} stars. Users are engaged; the maintainer is buffering.`;
  else if (stars >= 1000) quote = `${stars} stars and a description that fits on one line. Respectable restraint.`;
  else if (daysSincePush !== null && daysSincePush <= 14) quote = `Pushed ${daysSincePush === 0 ? "today" : `${daysSincePush} days ago`}. ${name} is the repository that still gets the good commits.`;
  else quote = `${name} is where the effort went. The rest of the profile is taking notes.`;

  return { name, description, stars, forks, openIssues: issues, language: best.language || "", daysSincePush, quote };
}

// Momentum = commits in the last 13 weeks vs the 13 weeks before (public repo stats, one API call).
// Returns null when there is too little activity to compare, or GitHub is still computing (HTTP 202).
function summarizeParticipation(allWeeks) {
  if (!Array.isArray(allWeeks) || allWeeks.length < 26) return null;
  const sum = (a) => a.reduce((n, v) => n + (Number(v) || 0), 0);
  const last13 = sum(allWeeks.slice(-13));
  const prior13 = sum(allWeeks.slice(-26, -13));
  if (last13 + prior13 < 5) return null;
  const pct = prior13 > 0 ? Math.round(((last13 - prior13) / prior13) * 100) : null;
  return { last13, prior13, pct };
}

async function fetchRepoMomentum(owner, repo, userToken = null) {
  try {
    const res = await fetch(`${BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/participation`, {
      headers: getHeaders(userToken),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status !== 200) return null; // 202 = still computing; anything else = skip quietly
    const json = await res.json();
    return summarizeParticipation(json?.all);
  } catch {
    return null; // optional evidence must never block a roast
  }
}

function summarizeCollaboration(login, collection) {
  if (!collection) return null;
  const own = String(login).toLowerCase();
  const sum = (list) => (list || []).reduce((n, r) => n + (r.contributions?.totalCount || 0), 0);
  const external = new Set();
  for (const list of [collection.pullRequestContributionsByRepository, collection.pullRequestReviewContributionsByRepository]) {
    for (const r of list || []) {
      const owner = r.repository?.owner?.login;
      if (owner && owner.toLowerCase() !== own) external.add(owner.toLowerCase());
    }
  }
  return {
    prs: sum(collection.pullRequestContributionsByRepository),
    reviews: sum(collection.pullRequestReviewContributionsByRepository),
    externalRepos: external.size,
    windowMonths: 12,
  };
}

async function fetchCollaboration(username, userToken = null) {
  const token = userToken || process.env.GITHUB_TOKEN;
  if (!token) return null; // GraphQL requires auth → signal stays "insufficient evidence"
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "GitRoast-App" },
      body: JSON.stringify({ query: COLLAB_QUERY, variables: { login: username } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return summarizeCollaboration(username, json?.data?.user?.contributionsCollection);
  } catch {
    return null; // never block a roast on optional evidence
  }
}

async function analyzeProfile(
  username,
  userToken = null,
  authUsername = null,
  isPro = false,
) {
  const isOwnProfileAndPro = Boolean(
    isPro &&
      authUsername &&
      username.toLowerCase() === authUsername.toLowerCase(),
  );

  const [profile, repos] = await Promise.all([
    fetchProfile(username, userToken),
    fetchRepos(username, userToken, isOwnProfileAndPro),
  ]);

  if (profile.type === "Organization") {
    const orgErr = new Error("ORGANIZATION_NOT_SUPPORTED");
    orgErr.code = "ORGANIZATION_NOT_SUPPORTED";
    throw orgErr;
  }

  const highlight = buildRepoHighlight(repos);
  const [commits, readme, collab, momentum] = await Promise.all([
    fetchRecentCommits(username, repos, userToken),
    checkReadmeQuality(username, repos, userToken),
    fetchCollaboration(username, userToken),
    highlight ? fetchRepoMomentum(username, highlight.name, userToken) : Promise.resolve(null),
  ]);

  const repoAnalysis = analyzeRepos(repos);
  const commitAnalysis = analyzeCommits(commits);
  const score = calculateRoastScore(repoAnalysis, commitAnalysis, readme);
  const grade = getGrade(score);
  const isGhost = repoAnalysis.totalOwn === 0;

  const stats = [
    {
      label: "Commit Quality",
      value: isGhost ? "0%" : `${commitAnalysis.qualityScore}%`,
      bad: isGhost || commitAnalysis.qualityScore < 50,
      note: isGhost
        ? "No commits recorded"
        : commitAnalysis.qualityScore < 30
          ? "Below panic threshold"
          : commitAnalysis.qualityScore < 60
            ? "Room for improvement"
            : "Not bad actually",
    },
    {
      label: "README Score",
      value: isGhost ? "0%" : readme.exists ? (readme.isEmpty ? "8%" : "72%") : "0%",
      bad: isGhost || !readme.exists || readme.isEmpty,
      note: isGhost
        ? "No repos to document"
        : !readme.exists
          ? "Does not exist"
          : readme.isEmpty
            ? "Technically exists"
            : "Actually has content",
    },
    {
      label: "Repo Survival",
      value: isGhost ? "0%" : `${100 - repoAnalysis.abandonedPct}%`,
      bad: isGhost || repoAnalysis.abandonedPct > 50,
      note: isGhost
        ? "0 public repos created"
        : `${repoAnalysis.abandonedCount} of ${repoAnalysis.totalOwn} abandoned`,
    },
    {
      label: "Shame Index",
      value: isGhost ? "100%" : `${100 - commitAnalysis.qualityScore}%`,
      bad: true,
      note: isGhost
        ? "Ghost account detected"
        : repoAnalysis.topLanguage !== "Nothing"
          ? `${repoAnalysis.topLanguage} still in prod`
          : "No code found",
    },
  ];

  const bioContrast = generateBioContrast(profile, repoAnalysis, commitAnalysis);

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
    bioContrast,
    collab,
    topRepos: pickTopRepos(repos),
    repoHighlight: highlight ? { ...highlight, momentum } : null,
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

async function analyzeWrapped(
  username,
  year = defaultWrappedYear(),
  userToken = null,
  authUsername = null,
  isPro = false,
) {
  const targetYear = parseInt(year, 10) || defaultWrappedYear();
  const isOwnProfileAndPro = Boolean(
    isPro &&
      authUsername &&
      username.toLowerCase() === authUsername.toLowerCase(),
  );

  const [profile, repos] = await Promise.all([
    fetchProfile(username, userToken),
    fetchRepos(username, userToken, isOwnProfileAndPro),
  ]);

  const ownRepos = (repos || []).filter((r) => !r.fork);
  const reposCreatedInYear = ownRepos.filter((r) => {
    return new Date(r.created_at).getFullYear() === targetYear;
  });
  const reposPushedInYear = ownRepos.filter((r) => {
    return new Date(r.pushed_at).getFullYear() === targetYear;
  });

  let mostAbandonedRepo = null;
  if (reposCreatedInYear.length > 0) {
    const sorted = [...reposCreatedInYear].sort((a, b) => {
      const lifeA = new Date(a.pushed_at) - new Date(a.created_at);
      const lifeB = new Date(b.pushed_at) - new Date(b.created_at);
      return lifeA - lifeB;
    });
    const candidate = sorted[0];
    const daysAlive = Math.max(
      0,
      Math.round(
        (new Date(candidate.pushed_at) - new Date(candidate.created_at)) /
          (1000 * 60 * 60 * 24),
      ),
    );
    mostAbandonedRepo = {
      name: candidate.name,
      description:
        candidate.description || "No description provided (abandoned in stealth)",
      daysAlive,
      language: candidate.language || "Unknown",
      stars: candidate.stargazers_count || 0,
      note:
        daysAlive === 0
          ? "Abandoned on day 1"
          : `Abandoned after ${daysAlive} day${daysAlive === 1 ? "" : "s"}`,
    };
  } else if (ownRepos.length > 0) {
    const oldestPushed = [...ownRepos].sort(
      (a, b) => new Date(a.pushed_at) - new Date(b.pushed_at),
    )[0];
    mostAbandonedRepo = {
      name: oldestPushed.name,
      description:
        oldestPushed.description || `Zero new repos created in ${targetYear}`,
      daysAlive: 0,
      language: oldestPushed.language || "None",
      stars: oldestPushed.stargazers_count || 0,
      note: `No new projects launched in ${targetYear}`,
    };
  } else {
    mostAbandonedRepo = {
      name: "none",
      description: `Didn't even start a repo in ${targetYear}`,
      daysAlive: 0,
      language: "None",
      stars: 0,
      note: "Zero repo ambition detected",
    };
  }

  const commitDates = [];
  const commitMessages = [];
  const reposToInspect = reposPushedInYear.slice(0, 4);

  const commitPromises = reposToInspect.map(async (repo) => {
    try {
      const endpoint = `/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/commits?author=${encodeURIComponent(username)}&since=${targetYear}-01-01T00:00:00Z&until=${targetYear}-12-31T23:59:59Z&per_page=100`;
      const res = await githubFetch(endpoint, userToken);
      if (Array.isArray(res)) {
        return res
          .map((c) => ({
            date: c.commit?.author?.date || c.commit?.committer?.date,
            message: c.commit?.message?.split("\n")[0]?.trim(),
          }))
          .filter((c) => c.date);
      }
    } catch {
      return [];
    }
    return [];
  });

  const commitResults = await Promise.all(commitPromises);
  commitResults.flat().forEach((c) => {
    commitDates.push(c.date);
    if (c.message) commitMessages.push(c.message);
  });

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthlyCounts = Array(12).fill(0);

  commitDates.forEach((d) => {
    const dt = new Date(d);
    if (dt.getFullYear() === targetYear) {
      monthlyCounts[dt.getMonth()]++;
    }
  });

  const totalCommits = commitDates.length;

  let minMonthIdx = 0;
  for (let i = 1; i < 12; i++) {
    if (monthlyCounts[i] < monthlyCounts[minMonthIdx]) minMonthIdx = i;
  }

  const worstMonthName = monthNames[minMonthIdx];
  const worstMonthCount = monthlyCounts[minMonthIdx];
  const worstMonth = {
    month: worstMonthName,
    commits: worstMonthCount,
    comment:
      worstMonthCount === 0
        ? `0 commits — touched grass or went into hibernation`
        : `${worstMonthCount} commit${worstMonthCount === 1 ? "" : "s"} — minimal vital signs detected`,
  };

  const uniqueDays = Array.from(
    new Set(
      commitDates
        .map((d) => new Date(d).toISOString().slice(0, 10))
        .filter((d) => d.startsWith(`${targetYear}`))
    )
  ).sort();

  let bestStreak = 0;
  let currentStreak = 0;
  let bestStreakEnd = null;

  if (uniqueDays.length > 0) {
    currentStreak = 1;
    bestStreak = 1;
    bestStreakEnd = uniqueDays[0];

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
          bestStreakEnd = uniqueDays[i];
        }
      } else {
        currentStreak = 1;
      }
    }
  }

  const streakDiedOn = bestStreakEnd
    ? new Date(bestStreakEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : `Never started in ${targetYear}`;

  let nightCommits = 0;
  let weekendCommits = 0;
  commitDates.forEach((d) => {
    const dt = new Date(d);
    const day = dt.getDay();
    const hour = dt.getHours();
    if (day === 0 || day === 6) weekendCommits++;
    if (hour >= 23 || hour < 5) nightCommits++;
  });

  const commitAnalysis = analyzeCommits(commitMessages);
  const repoAnalysis = analyzeRepos(repos || []);

  let archetype = "";
  let archetypeEmoji = "⚡";
  let archetypeDesc = "";

  if (totalCommits === 0 && reposCreatedInYear.length === 0) {
    archetype = "The Ghost";
    archetypeEmoji = "👻";
    archetypeDesc =
      "Registered on GitHub, vanished without a trace. Commits: purely theoretical.";
  } else if (reposCreatedInYear.length >= 4 && mostAbandonedRepo?.daysAlive <= 3) {
    archetype = "The Chronic Starter";
    archetypeEmoji = "🚀";
    archetypeDesc = `Started ${reposCreatedInYear.length} projects in ${targetYear}. Finished approximately zero. A true visionary of abandoned ideas.`;
  } else if (nightCommits > 0 && nightCommits / Math.max(1, totalCommits) > 0.4) {
    archetype = "The Midnight Patcher";
    archetypeEmoji = "🌙";
    archetypeDesc =
      "Only codes when reasonable humans sleep. Powered by caffeine, dark mode, and commit regret.";
  } else if (weekendCommits > 0 && weekendCommits / Math.max(1, totalCommits) > 0.45) {
    archetype = "The Weekend Warrior";
    archetypeEmoji = "🏖️";
    archetypeDesc =
      "Zero work-life balance detected. Pushes code on Sundays at 2am because relaxation is terrifying.";
  } else if (commitAnalysis.qualityScore < 35 && commitMessages.length >= 3) {
    archetype = "The Single-Word Committer";
    archetypeEmoji = "📝";
    archetypeDesc =
      "'fix', 'test', 'wip', 'done', 'asdf'. The poetry of an unbothered developer.";
  } else if (ownRepos.length >= 20 && profile.public_repos > 30) {
    archetype = "The Digital Hoarder";
    archetypeEmoji = "📦";
    archetypeDesc =
      "Forked half of GitHub, starred everything, finished nothing. Storing repos for the apocalypse.";
  } else if (bestStreak >= 10) {
    archetype = "The Suspiciously Diligent";
    archetypeEmoji = "🟢";
    archetypeDesc = `A streak of ${bestStreak} consecutive days. Either deeply dedicated or running a cron job to keep the squares green.`;
  } else {
    archetype = "The Pragmatic Procrastinator";
    archetypeEmoji = "🎯";
    archetypeDesc =
      "Commits strictly when deadlines loom or guilt becomes physically unbearable.";
  }

  const annualScore = Math.max(
    10,
    Math.min(
      99,
      calculateRoastScore(repoAnalysis, commitAnalysis, {
        exists: true,
        isEmpty: false,
      }),
    ),
  );
  const annualGrade = getGrade(annualScore);

  const annualRoast = `In ${targetYear}, @${username} logged ${totalCommits} commits, survived a best streak of ${bestStreak} day${bestStreak === 1 ? "" : "s"} before completely giving up on ${streakDiedOn}, and crowned "${mostAbandonedRepo.name}" as their most abandoned project. Verdict: ${archetype}.`;

  return {
    year: targetYear,
    username,
    avatarUrl: profile.avatar_url,
    totalCommits,
    worstMonth,
    bestStreak,
    streakDiedOn,
    mostAbandonedRepo,
    archetype,
    archetypeEmoji,
    archetypeDesc,
    annualScore,
    annualGrade,
    monthlyCommits: monthNames.map((name, i) => ({
      month: name,
      count: monthlyCounts[i],
    })),
    annualRoast,
  };
}

async function analyzeUniverse(
  username,
  userToken = null,
  authUsername = null,
  isPro = false,
) {
  const isOwnProfileAndPro = Boolean(
    isPro &&
      authUsername &&
      username.toLowerCase() === authUsername.toLowerCase(),
  );

  const [profile, repos] = await Promise.all([
    fetchProfile(username, userToken),
    fetchRepos(username, userToken, isOwnProfileAndPro),
  ]);

  if (profile.type === "Organization") {
    const orgErr = new Error("ORGANIZATION_NOT_SUPPORTED");
    orgErr.code = "ORGANIZATION_NOT_SUPPORTED";
    throw orgErr;
  }

  const repoAnalysis = analyzeRepos(repos);
  const rawScore = calculateRoastScore(
    repoAnalysis,
    { qualityScore: 70 },
    { exists: true, isEmpty: false },
  );
  const score = Math.max(10, Math.min(99, rawScore));
  const grade = getGrade(score);

  let spectralClass = "G-Type Yellow Solar";
  let starColor = "#FFB700";
  let coronaColor = "rgba(255, 183, 0, 0.4)";
  let starTitle = "Main Sequence Solar Engine";

  if (score >= 85) {
    spectralClass = "O-Type Blue Hypergiant";
    starColor = "#00E5FF";
    coronaColor = "rgba(0, 229, 255, 0.45)";
    starTitle = "Luminous Celestial Architect";
  } else if (score >= 70) {
    spectralClass = "B-Type Blue-White Giant";
    starColor = "#80D8FF";
    coronaColor = "rgba(128, 216, 255, 0.4)";
    starTitle = "High-Energy Stellar Builder";
  } else if (score >= 55) {
    spectralClass = "G-Type Golden Sun";
    starColor = "#FFB700";
    coronaColor = "rgba(255, 183, 0, 0.35)";
    starTitle = "Equilibrium Standard Sun";
  } else if (score >= 40) {
    spectralClass = "K-Type Orange Giant";
    starColor = "#FF6B00";
    coronaColor = "rgba(255, 107, 0, 0.4)";
    starTitle = "Overheated Late-Night Red Giant";
  } else {
    spectralClass = "M-Type Red Dwarf / Dying Star";
    starColor = "#FF3333";
    coronaColor = "rgba(255, 51, 51, 0.5)";
    starTitle = "Erratic Flare Star (High Panic Factor)";
  }

  const star = {
    username,
    name: profile.name || username,
    avatarUrl: profile.avatar_url,
    bio: profile.bio || "Roaming through deep cyberspace.",
    score,
    grade,
    spectralClass,
    starTitle,
    starColor,
    coronaColor,
    radius: 14 + Math.round((score / 100) * 8),
    temperature: `${(score * 120 + 3000).toLocaleString()} K`,
    luminosity: Math.round((profile.followers || 0) * 1.5 + (profile.public_repos || 0) * 2 + 100),
    totalRepos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
  };

  const validRepos = (repos || []).filter((r) => !r.fork);
  const pool = validRepos.length > 0 ? validRepos : (repos || []);

  const sortedRepos = [...pool].sort((a, b) => {
    const starDiff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
    if (starDiff !== 0) return starDiff;
    const timeA = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
    const timeB = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
    return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
  }).slice(0, 18);

  const now = Date.now();

  const planets = sortedRepos.map((repo, idx) => {
    const rawPushed = repo.pushed_at || repo.created_at;
    const parsedTime = rawPushed ? new Date(rawPushed).getTime() : now;
    const pushedTime = Number.isFinite(parsedTime) ? parsedTime : now;
    const daysSincePush = Math.max(0, Math.floor((now - pushedTime) / (1000 * 60 * 60 * 24)));
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const sizeKb = repo.size || 0;

    let planetType = "barren_rock";
    let typeName = "Barren Terrestrial Rock";
    let themeColor = "#90A4AE";
    let atmosphere = "Thin Vacuum";
    let verdict = "Cratered planetary outpost with quiet git logs.";
    let hasRings = false;

    if ((sizeKb > 180000 && stars === 0) || (daysSincePush > 730 && stars === 0 && !repo.description)) {
      planetType = "black_hole";
      typeName = "Singularity (Supermassive Black Hole)";
      themeColor = "#7A00FF";
      atmosphere = "Infinite Gravity Well & Dark Vacuum";
      verdict = `Gravitational anomaly holding ${Math.round(sizeKb / 1024)}MB of untracked node_modules. Light cannot escape.`;
    } else if (daysSincePush <= 14) {
      planetType = "inferno";
      typeName = "Volcanic Magma World";
      themeColor = "#FF4500";
      atmosphere = "Superheated Plasma & Live Commits";
      verdict = "Boiling planetary core! Recent frantic commits detected directly on main.";
    } else if (stars >= 15 || (daysSincePush <= 60 && repo.description)) {
      planetType = "habitable";
      typeName = "Habitable Biosphere";
      themeColor = "#00E676";
      atmosphere = "Oxygen-Rich & Documented Code";
      verdict = "Rare living planetary oasis equipped with a real README and thriving architecture.";
    } else if (sizeKb > 25000 || forks >= 5) {
      planetType = "gas_giant";
      typeName = "Ringed Gas Giant";
      themeColor = "#FFB300";
      atmosphere = "Thick Methane & Dependency Cloud";
      verdict = "Enormous gas giant holding deep architectural layers and unfinished branch rings.";
      hasRings = true;
    } else if (daysSincePush > 365) {
      planetType = "frozen_ice";
      typeName = "Sub-Zero Cryo World";
      themeColor = "#00E5FF";
      atmosphere = "Frozen Methane & Absolute Zero";
      verdict = `Permafrost planet abandoned ${daysSincePush} days ago. Even alien rovers froze to death here.`;
    }

    const orbitDistance = 38 + idx * 17 + Math.min(25, idx * 2.5);
    const sizeScale = Math.max(2.0, Math.min(5.6, 2.2 + Math.log10(Math.max(1, stars + 1)) * 1.5 + (sizeKb > 50000 ? 1 : 0)));
    const orbitSpeed = 0.009 / (1 + idx * 0.12);
    const rotationSpeed = 0.012 + (idx % 3) * 0.006;
    const moonsCount = Math.min(4, Math.floor(forks / 3) + (repo.open_issues_count > 0 ? 1 : 0));

    return {
      id: `planet-${idx}`,
      index: idx + 1,
      name: repo.name,
      description: repo.description || "No description provided (lost in outer space).",
      language: repo.language || "Unknown Void",
      stars,
      forks,
      sizeKb,
      openIssues: repo.open_issues_count || 0,
      isFork: Boolean(repo.fork),
      daysSincePush,
      planetType,
      typeName,
      themeColor,
      atmosphere,
      verdict,
      orbitDistance,
      sizeScale,
      orbitSpeed,
      rotationSpeed,
      hasRings,
      moonsCount,
    };
  });

  if (planets.length === 0) {
    planets.push({
      id: "planet-void",
      index: 1,
      name: "void-capsule",
      description: "Mysterious drifting probe in an empty stellar sector.",
      language: "Empty Void",
      stars: 0,
      forks: 0,
      sizeKb: 4,
      openIssues: 0,
      isFork: false,
      daysSincePush: 999,
      planetType: "barren_rock",
      typeName: "Lonely Asteroid",
      themeColor: "#9E9E9E",
      atmosphere: "Total Vacuum",
      verdict: "Zero public repos discovered. This star system is completely uninhabited.",
      orbitDistance: 45,
      sizeScale: 2.2,
      orbitSpeed: 0.006,
      rotationSpeed: 0.01,
      hasRings: false,
      moonsCount: 0,
    });
  }

  const systemMetrics = {
    totalPlanets: planets.length,
    habitableCount: planets.filter((p) => p.planetType === "habitable").length,
    frozenCount: planets.filter((p) => p.planetType === "frozen_ice").length,
    blackHoleCount: planets.filter((p) => p.planetType === "black_hole").length,
    infernoCount: planets.filter((p) => p.planetType === "inferno").length,
    gasGiantCount: planets.filter((p) => p.planetType === "gas_giant").length,
    galaxyType:
      score >= 80
        ? "Super-Dense Hypergiant Cluster"
        : score >= 60
          ? "Stable Spiral Galactic Sector"
          : "Volatile Dark Nebula of Technical Debt",
    cosmicVerdict:
      score >= 75
        ? "A dazzling celestial empire with thriving architectures and blazing stellar energy."
        : score >= 45
          ? "A chaotic planetary sector where half the colonies survived and the other half froze to death."
          : "A cosmic wasteland littered with dead cryo-worlds and black holes swallowing forgotten code.",
  };

  return {
    star,
    planets,
    systemMetrics,
  };
}

module.exports = { analyzeProfile, analyzeWrapped, analyzeUniverse, summarizeCollaboration, pickTopRepos, buildRepoHighlight, summarizeParticipation };

