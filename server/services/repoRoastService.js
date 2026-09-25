// ============================================================
// GITROAST — Repository Deep Roast Engine
// ============================================================
// WHAT: Analyzes a specific GitHub repository (owner/repo) and
//       generates a dedicated repository roast report.
// WHY:
//   - High developer engagement: devs love roasting specific projects.
//   - Pro feature value: lets users roast private/public repositories.
//   - Diagnoses commit smells, missing tests, and open issue graveyards.
// ============================================================

const { generateAIRepoRoast, generateAIRoast, generateAIRedemptionPlan } = require("./aiService");
const { evaluateCommitHygiene } = require("./typeSafeService");
const { logger } = require("../utils/logger");

const BASE_URL = "https://api.github.com";

function getHeaders(token = null) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitRoast-App",
  };
  const auth = token || process.env.GITHUB_TOKEN;
  if (auth) headers["Authorization"] = `token ${auth}`;
  return headers;
}

async function githubFetch(endpoint, token = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: getHeaders(token),
    signal: AbortSignal.timeout(10000),
  });

  if (res.status === 404) {
    const err = new Error("REPO_NOT_FOUND");
    err.code = "REPO_NOT_FOUND";
    throw err;
  }
  if (res.status === 403) {
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      const err = new Error("RATE_LIMIT_EXCEEDED");
      err.code = "RATE_LIMIT_EXCEEDED";
      throw err;
    }
  }
  if (!res.ok) {
    throw new Error(`GITHUB_API_ERROR_${res.status}`);
  }

  return res.json();
}

async function analyzeRepository(owner, repoName, userToken = null, isPro = false, intensity = "savage") {
  // 1. Fetch repo metadata
  // 2. Fetch recent commits & root directory contents in parallel
  const [repo, commitsData, contentsData] = await Promise.all([
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`, userToken),
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/commits?per_page=30`, userToken).catch(() => []),
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents`, userToken).catch(() => []),
  ]);

  const commits = Array.isArray(commitsData) ? commitsData : [];
  const contents = Array.isArray(contentsData) ? contentsData : [];

  const commitMessages = commits
    .map((c) => c.commit?.message?.split("\n")[0]?.trim())
    .filter(Boolean);

  // Analyze commit hygiene
  const lazyKeywords = ["fix", "wip", "update", "asdasd", "pls work", "test", "oops", "clean", "done", "minor", "temp"];
  let lazyCommitCount = 0;
  commitMessages.forEach((msg) => {
    const lower = msg.toLowerCase();
    if (lazyKeywords.some((k) => lower === k || lower.startsWith(`${k} `) || lower.endsWith(` ${k}`))) {
      lazyCommitCount++;
    }
  });

  // ── TypeSafe AI (System One / Jev) Semantic Hygiene Evaluation ────────
  // WHAT: Evaluates developer commit discipline and descriptive quality.
  // WHY: Replaces rigid keyword regexes with semantic scoring of developer hygiene.
  // WHERE & WHEN TO USE: During repository deep analysis when commits are available.
  // USE CASES: Detecting nuanced low-effort commits beyond simple keywords.
  // WHEN NOT TO USE: When commits are empty or when network latency must be bypassed.
  let commitQuality = commitMessages.length > 0
    ? Math.max(10, Math.round(100 - (lazyCommitCount / commitMessages.length) * 80))
    : 30;

  if (commitMessages.length > 0) {
    try {
      const typeSafeResult = await evaluateCommitHygiene(commitMessages);
      if (typeSafeResult.aiEvaluated) {
        // Blend heuristic (40%) and semantic TypeSafe score (60%) for calibrated accuracy
        commitQuality = Math.round((commitQuality * 0.4) + (typeSafeResult.qualityPercentage * 0.6));
      }
    } catch {
      // Fallback already preserved in commitQuality
    }
  }

  // File structure checks
  const fileNames = contents.map((f) => f.name.toLowerCase());
  const hasTests = fileNames.some((n) => n.includes("test") || n.includes("spec"));
  const hasReadme = fileNames.includes("readme.md") || fileNames.includes("readme");
  const hasGitignore = fileNames.includes(".gitignore");
  const hasLicense = Boolean(repo.license);

  // Maintenance & age check
  const lastPushed = new Date(repo.pushed_at || repo.updated_at || Date.now());
  const monthsInactive = Math.floor((Date.now() - lastPushed.getTime()) / (1000 * 60 * 60 * 24 * 30));

  // Compute code smells
  const codeSmells = [];
  if (!hasTests) codeSmells.push("Zero automated tests detected (Testing in production)");
  if (lazyCommitCount >= 3) codeSmells.push(`${lazyCommitCount} low-effort commits found ("${commitMessages[0] || 'fix'}")`);
  if (!hasLicense) codeSmells.push("No LICENSE file (All rights reserved to your bugs)");
  if (!hasGitignore) codeSmells.push("Missing .gitignore (Node_modules in repo danger)");
  if (monthsInactive >= 6) codeSmells.push(`Abandoned for ${monthsInactive} months without commits`);
  if (repo.open_issues_count > 20) codeSmells.push(`Issue backlog hoarding (${repo.open_issues_count} open issues)`);
  if (!repo.description) codeSmells.push("No repository description provided");

  // Calculate Repo Score (1-99)
  let score = 75;
  if (!hasTests) score -= 25;
  if (!hasLicense) score -= 10;
  if (!hasReadme) score -= 20;
  if (commitQuality < 50) score -= 15;
  if (monthsInactive >= 6) score -= 15;
  if (repo.open_issues_count > 30) score -= 10;
  score = Math.max(8, Math.min(96, score));

  let grade = "F";
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";
  else if (score < 25) grade = "F-";

  // Build rule-based roast text
  let ruleRoast = "";
  if (!hasTests && commitQuality < 50) {
    ruleRoast = `${repoName} runs on pure faith and zero unit tests. With commit messages like "${commitMessages[0] || 'fix bug'}", even ChatGPT refuses to debug this.`;
  } else if (monthsInactive >= 6) {
    ruleRoast = `${repoName} was a masterpiece for exactly 48 hours before being abandoned ${monthsInactive} months ago to collect digital dust.`;
  } else if (!hasReadme) {
    ruleRoast = `${repoName} has no README because the author expects visitors to decipher their variable names like ancient hieroglyphics.`;
  } else {
    ruleRoast = `${repoName} is ${repo.stargazers_count} stars of architectural chaos, held together by duct tape, prayer, and Stack Overflow snippets.`;
  }

  let finalRoast = ruleRoast;
  let roastSource = "rules";

  if (isPro) {
    try {
      const repoMetrics = {
        owner,
        repoName,
        fullName: `${owner}/${repoName}`,
        description: repo.description,
        language: repo.language || "Unknown",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        openIssues: repo.open_issues_count || 0,
        score,
        grade,
        commitQuality,
        codeSmells,
        shameCommits: commitMessages.slice(0, 4),
        monthsInactive,
        hasTests,
      };
      const aiText = await generateAIRepoRoast(repoMetrics, intensity);
      if (aiText) {
        finalRoast = aiText;
        roastSource = "ai";
      }
    } catch (err) {
      logger.warn("RepoRoast", "AI generation failed, using rule roast", { message: err.message });
    }
  }

  // ── AI Redemption Plan for Repository ───────────────────────
  // WHAT: Generates 3 humorous, high-impact architecture fixes for this codebase.
  // WHY: Delivers immediate engineering value turning a critical roast into an improvement plan.
  // WHERE & WHEN TO USE: Calculated on Pro repo roast requests or fallback deterministic rules.
  // USE CASES: Engineering sprint planning, technical debt triage, and portfolio cleanups.
  // WHEN NOT TO USE: Never throw an unhandled error if LLM fails (fail-open pattern).
  let redemptionPlan = [];
  if (isPro) {
    try {
      redemptionPlan = await generateAIRedemptionPlan({
        fullName: `${owner}/${repoName}`,
        language: repo.language || "Unknown",
        stars: repo.stargazers_count || 0,
        openIssues: repo.open_issues_count || 0,
        hasTests,
        commitQuality,
        codeSmells,
        hasReadme,
        monthsInactive,
      });
    } catch (err) {
      logger.warn("RepoRoast", "Failed to generate repo redemption plan", { message: err.message });
    }
  }

  return {
    owner,
    repoName,
    fullName: `${owner}/${repoName}`,
    description: repo.description || "No description provided.",
    language: repo.language || "Unknown",
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    openIssues: repo.open_issues_count || 0,
    score,
    grade,
    hasTests,
    hasReadme,
    hasLicense,
    commitQuality,
    codeSmells,
    shameCommits: commitMessages.slice(0, 4),
    roast: finalRoast,
    roastSource,
    redemptionPlan,
    intensity,
    url: repo.html_url,
    avatarUrl: repo.owner?.avatar_url || `https://avatars.githubusercontent.com/${owner}?s=96`,
  };
}

module.exports = { analyzeRepository };
