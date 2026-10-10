const USERNAME_REGEX = /^[a-zA-Z0-9-._]+$/;

// ── Intensity ────────────────────────────────────────────────
// Canonical (design) vocabulary: warm / crispy / nuclear.
// Legacy values (mild / savage) are still accepted everywhere and are
// normalised on input, so old Mongo documents and old links keep working.
const INTENSITY_LEVELS = ["warm", "crispy", "nuclear"];
const LEGACY_INTENSITY_ALIASES = { mild: "warm", savage: "crispy" };
const DEFAULT_INTENSITY = "crispy";
// Roast engines/prompts are still keyed by the legacy names.
const ENGINE_INTENSITY = { warm: "mild", crispy: "savage", nuclear: "nuclear" };
const ALL_INTENSITY_VALUES = [...INTENSITY_LEVELS, ...Object.keys(LEGACY_INTENSITY_ALIASES)];

function normalizeIntensity(raw, fallback = DEFAULT_INTENSITY) {
  const v = String(raw || "").toLowerCase().trim();
  if (INTENSITY_LEVELS.includes(v)) return v;
  if (LEGACY_INTENSITY_ALIASES[v]) return LEGACY_INTENSITY_ALIASES[v];
  return fallback;
}
function toEngineIntensity(raw) {
  return ENGINE_INTENSITY[normalizeIntensity(raw)];
}

// ── Personas ─────────────────────────────────────────────────
// Three featured voices from the design + legacy voices kept as "more voices".
const PERSONAS = [
  { id: "staff_engineer", label: "Staff engineer", blurb: "Dry, specific", featured: true },
  { id: "chaos_intern", label: "Chaos intern", blurb: "Fast, feral", featured: true },
  { id: "historian", label: "Historian", blurb: "Long memory", featured: true },
  { id: "hinglish", label: "Desi Tech Lead", blurb: "Hinglish office comedy", featured: false },
  { id: "ramsay", label: "Chef Ramsay", blurb: "Kitchen fury", featured: false },
  { id: "shakespearean", label: "Shakespeare", blurb: "Elizabethan tragedy", featured: false },
];
const LEGACY_PERSONA_ALIASES = { classic: "staff_engineer", techbro: "chaos_intern" };
const PERSONA_IDS = PERSONAS.map((p) => p.id);
const ALL_PERSONA_VALUES = [...PERSONA_IDS, ...Object.keys(LEGACY_PERSONA_ALIASES)];
const DEFAULT_PERSONA = "staff_engineer";

function normalizePersona(raw, fallback = DEFAULT_PERSONA) {
  const v = String(raw || "").toLowerCase().trim();
  if (PERSONA_IDS.includes(v)) return v;
  if (LEGACY_PERSONA_ALIASES[v]) return LEGACY_PERSONA_ALIASES[v];
  return fallback;
}

// ── Roles / plans ────────────────────────────────────────────
const USER_ROLES = ["developer", "recruiter"];
const PLAN_IDS = ["roaster", "historian"];

const ROAST_REACTION_TYPES = ["relatable", "destroyed", "savage"];
const BATTLE_REACTION_TYPES = ["relatable", "destroyed", "savage"];
const ALL_REACTION_TYPES = [...new Set([...ROAST_REACTION_TYPES, ...BATTLE_REACTION_TYPES])];

const ROAST_GRADES = ["A", "B", "C", "D", "F", "F-"];

const ERROR_CODES = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ORGANIZATION_NOT_SUPPORTED: "ORGANIZATION_NOT_SUPPORTED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
  CAPTCHA_FAILED: "CAPTCHA_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  PRO_REQUIRED: "PRO_REQUIRED",
  INVALID_ID: "INVALID_ID",
  INVALID_TYPE: "INVALID_TYPE",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  SERVER_ERROR: "SERVER_ERROR",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    USERNAME_REGEX,
    INTENSITY_LEVELS,
    LEGACY_INTENSITY_ALIASES,
    ALL_INTENSITY_VALUES,
    DEFAULT_INTENSITY,
    ENGINE_INTENSITY,
    normalizeIntensity,
    toEngineIntensity,
    PERSONAS,
    PERSONA_IDS,
    ALL_PERSONA_VALUES,
    LEGACY_PERSONA_ALIASES,
    DEFAULT_PERSONA,
    normalizePersona,
    USER_ROLES,
    PLAN_IDS,
    ROAST_REACTION_TYPES,
    BATTLE_REACTION_TYPES,
    ALL_REACTION_TYPES,
    ROAST_GRADES,
    ERROR_CODES,
  };
}

