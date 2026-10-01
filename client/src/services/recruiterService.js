// ============================================================
// GITROAST — Recruiter Talent Intelligence Client Service
// ============================================================
/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Client-side HTTP service wrapper for all Candidate X-Ray, Recruiter Dashboard,
 * and Saved Candidate bookmarking endpoints.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * 1. Centralizes Authorization header injection using 'gitroast_recruiter_token'.
 * 2. Guaranteed API_BASE resolution: prevents relative URL resolution to Vercel (404s).
 * 3. Enforces URI parameter encoding and resilient JSON error handling.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Consumed by /recruiter/dashboard, /recruiter/dashboard/analyze, and /recruiter/dashboard/saved.
 * 
 * ── USE CASES: ───────────────────────────────────────────────
 * - Loading saved candidate lists and hiring notes.
 * - Generating real-time Gemini Hireability Briefs for candidates.
 * 
 * ── WHEN NOT TO USE: ─────────────────────────────────────────
 * Do not call from developer roasts or unauthenticated public leaderboard screens.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const RECRUITER_TOKEN_KEY = 'gitroast_recruiter_token';

/**
 * WHAT: Generates HTTP headers with Bearer token authentication.
 * WHY: Recruiter endpoints require requireRecruiterAuth middleware on Render.
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(RECRUITER_TOKEN_KEY) : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * WHAT: Resilient JSON parser that handles 502/504 gateway HTML without crashing.
 * WHY: Accommodates Render container cold starts gracefully.
 */
async function safeParseJson(res) {
  const text = await res.text().catch(() => '');
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: res.status >= 500 ? 'GATEWAY_TIMEOUT' : 'UNKNOWN_ERROR',
      message: res.status >= 500 ? 'Server is waking up. Please retry in a moment.' : text
    };
  }
}

/**
 * WHAT: Fetches high-level candidate counts and bookmark metrics for recruiter dashboard.
 * WHERE: /recruiter/dashboard
 */
export const getDashboardStats = async () => {
  const res = await fetch(`${API_BASE}/api/recruiter/dashboard/stats`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard stats');
  return data;
};

/**
 * WHAT: Fetches the list of bookmarked candidates and notes for the logged-in recruiter.
 * WHERE: /recruiter/dashboard/saved
 */
export const getSavedCandidates = async () => {
  const res = await fetch(`${API_BASE}/api/recruiter/candidates/saved`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || 'Failed to fetch saved candidates');
  return data;
};

/**
 * WHAT: Saves a developer to the recruiter's saved candidates vault.
 * WHERE: Candidate X-Ray profile card action.
 */
export const saveCandidate = async (username, notes = '') => {
  const res = await fetch(`${API_BASE}/api/recruiter/candidates/saved`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, notes }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to save candidate');
  return data;
};

/**
 * WHAT: Removes a candidate from the recruiter's saved candidate list.
 * WHERE: Saved candidate table row delete action.
 */
export const removeCandidate = async (username) => {
  const res = await fetch(`${API_BASE}/api/recruiter/candidates/saved/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || 'Failed to remove candidate');
  return data;
};

/**
 * WHAT: Synthesizes a candidate's GitHub profile and commits into an AI Hireability Brief.
 * WHERE: /recruiter/dashboard/analyze/[username]
 */
export const analyzeCandidate = async (username) => {
  const res = await fetch(`${API_BASE}/api/recruiter/analyze/${encodeURIComponent(username)}`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(60000), // WHY: 60s allows Gemini analysis to settle
  });
  const data = await safeParseJson(res);
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to analyze candidate');
  return data;
};
