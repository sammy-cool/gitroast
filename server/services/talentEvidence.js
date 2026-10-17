/**
 * Talent evidence model — "Role evidence v1".
 *
 * Derives explainable, public-only signals from the latest public Roast
 * snapshot of a developer. Rules (mirrors the design's responsible-use copy):
 *  - public data only; no age/gender/ethnicity/health/location inference
 *  - sparse evidence is labelled "insufficient", never penalised
 *  - humour never affects the score (roast text is not an input)
 *  - this is evidence alignment, not a hiring recommendation
 */
const MODEL_VERSION = "Role evidence v1.1";

const ROLE_MODELS = {
  "senior-ic": { label: "Senior IC", weights: { depth: 0.35, collaboration: 0.25, documentation: 0.2, consistency: 0.2 } },
  "staff-ic": { label: "Staff IC", weights: { depth: 0.3, collaboration: 0.3, documentation: 0.25, consistency: 0.15 } },
  "mid-ic": { label: "Mid-level IC", weights: { depth: 0.3, collaboration: 0.2, documentation: 0.2, consistency: 0.3 } },
  "junior-ic": { label: "Junior IC", weights: { depth: 0.2, collaboration: 0.2, documentation: 0.2, consistency: 0.4 } },
};
const DEFAULT_ROLE = "senior-ic";

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

// Collaboration = public PR + review activity in the last 12 months, plus breadth (repos owned by others).
// Fewer than 3 public events is "insufficient evidence", never a low score: private or internal
// collaboration is invisible here and must not be penalised.
const MIN_COLLAB_EVENTS = 3;
function collaborationSignal(collab) {
  const source = "public pull requests & reviews (12 months)";
  if (!collab) return { value: null, source, confidence: "insufficient" };
  const prs = Number(collab.prs) || 0;
  const reviews = Number(collab.reviews) || 0;
  const external = Number(collab.externalRepos) || 0;
  if (prs + reviews < MIN_COLLAB_EVENTS) return { value: null, source, confidence: "insufficient" };
  const value = clamp(Math.min(45, Math.log2(reviews + 1) * 9) + Math.min(25, Math.log2(prs + 1) * 6) + Math.min(30, external * 6));
  return { value, source, confidence: prs + reviews >= 10 ? "high" : "medium" };
}

function computeSignals(snapshot = {}) {
  const repos = Number(snapshot.totalRepos) || 0;
  const abandoned = Number(snapshot.abandonedCount) || 0;
  const stars = Number(snapshot.totalStars) || 0;
  const active = Math.max(0, repos - abandoned);
  const signals = {};

  if (repos > 0) {
    signals.depth = {
      value: clamp(30 + Math.log10(stars + 1) * 14 + Math.min(30, active * 2.5)),
      source: "public repositories + stars",
      confidence: repos >= 8 ? "high" : "medium",
    };
    signals.documentation = {
      value: clamp((snapshot.hasReadme ? 55 : 25) + (repos ? (1 - abandoned / repos) * 25 : 0)),
      source: "README presence + maintained repositories",
      confidence: "medium",
    };
  }
  if (Number(snapshot.commitQuality) > 0) {
    signals.consistency = {
      value: clamp(snapshot.commitQuality),
      source: "commit message quality (public commits)",
      confidence: repos >= 5 ? "high" : "medium",
    };
  }
  signals.collaboration = collaborationSignal(snapshot.collab);
  return signals;
}

function computeFit(signals, roleKey = DEFAULT_ROLE) {
  const model = ROLE_MODELS[roleKey] || ROLE_MODELS[DEFAULT_ROLE];
  let total = 0;
  let weight = 0;
  for (const [key, w] of Object.entries(model.weights)) {
    const sig = signals[key];
    if (sig && typeof sig.value === "number") {
      total += sig.value * w;
      weight += w;
    }
  }
  if (weight === 0) return { score: null, label: "Insufficient evidence", coverage: 0 };
  const score = clamp(total / weight);
  const label = score >= 85 ? "Strong" : score >= 70 ? "Good" : "Emerging";
  return { score, label, coverage: Math.round(weight * 100) };
}

module.exports = { collaborationSignal, MIN_COLLAB_EVENTS, MODEL_VERSION, ROLE_MODELS, DEFAULT_ROLE, computeSignals, computeFit };
