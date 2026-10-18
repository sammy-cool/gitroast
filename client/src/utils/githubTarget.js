// Shared GitHub input handling: "@user", full URLs and "owner/repo" all normalise to a clean target.
const USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;
const REPO_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9._-]{1,100}$/;

export function cleanGithubTarget(raw) {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/^(?:www\.)?github\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

export const isGithubUser = (v) => USER_RE.test(v);
export const isGithubRepo = (v) => REPO_RE.test(v);

/** → { kind: "user" | "repo" | "invalid", value } */
export function parseGithubTarget(raw) {
  const value = cleanGithubTarget(raw);
  if (isGithubRepo(value)) return { kind: "repo", value };
  if (isGithubUser(value)) return { kind: "user", value };
  return { kind: "invalid", value };
}
