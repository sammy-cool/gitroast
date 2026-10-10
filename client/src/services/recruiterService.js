const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(json?.message || "Request failed");
    err.code = json?.error || "REQUEST_FAILED";
    err.status = res.status;
    throw err;
  }
  return json;
}

// ── Auth ──
export const recruiterSignup = ({ email, password, acceptResponsibleUse }) =>
  request("/api/auth/recruiter/signup", { method: "POST", body: { email, password, acceptResponsibleUse } });
export const recruiterLogin = ({ email, password }) =>
  request("/api/auth/recruiter/login", { method: "POST", body: { email, password } });
export const recruiterGoogle = ({ credential, acceptResponsibleUse }) =>
  request("/api/auth/recruiter/google", { method: "POST", body: { credential, acceptResponsibleUse } });

// ── Workspace ──
const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
};
export const searchTalent = (token, { q, role, language } = {}) => request(`/api/recruiter/talent${qs({ q, role, language })}`, { token });
export const getCandidate = (token, username, role) => request(`/api/recruiter/talent/${encodeURIComponent(username)}${qs({ role })}`, { token });
export const saveTalent = (token, username) => request(`/api/recruiter/saved/${encodeURIComponent(username)}`, { method: "POST", token });
export const unsaveTalent = (token, username) => request(`/api/recruiter/saved/${encodeURIComponent(username)}`, { method: "DELETE", token });
export const listSaved = (token) => request("/api/recruiter/saved", { token });
export const listShortlists = (token) => request("/api/recruiter/shortlists", { token });
export const createShortlist = (token, body) => request("/api/recruiter/shortlists", { method: "POST", token, body });
export const updateShortlist = (token, id, body) => request(`/api/recruiter/shortlists/${id}`, { method: "PATCH", token, body });
export const deleteShortlist = (token, id) => request(`/api/recruiter/shortlists/${id}`, { method: "DELETE", token });
export const compareTalent = (token, usernames, role) => request(`/api/recruiter/compare${qs({ u: usernames.join(","), role })}`, { token });
export const getMethodology = (token) => request("/api/recruiter/methodology", { token });
