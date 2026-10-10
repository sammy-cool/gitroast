// Client mirror of shared/constants.js (canonical vocabulary: warm/crispy/nuclear,
// staff_engineer/chaos_intern/historian). A test keeps both files in sync.
export const INTENSITIES = [
  { key: "warm", label: "Warm-up", description: "Gentle observations. Still toasty.", isPro: false },
  { key: "crispy", label: "Crispy", description: "Sharp comedy. The default.", isPro: false },
  { key: "nuclear", label: "Nuclear", description: "No mercy for the commit log.", isPro: true },
];
const LEGACY_INTENSITY = { mild: "warm", savage: "crispy" };
export const DEFAULT_INTENSITY = "crispy";

export const PERSONAS = [
  { key: "staff_engineer", label: "Staff engineer", blurb: "Dry, specific", featured: true },
  { key: "chaos_intern", label: "Chaos intern", blurb: "Fast, feral", featured: true },
  { key: "historian", label: "Historian", blurb: "Long memory", featured: true },
  { key: "hinglish", label: "Desi Tech Lead", blurb: "Hinglish office comedy", featured: false },
  { key: "ramsay", label: "Chef Ramsay", blurb: "Kitchen fury", featured: false },
  { key: "shakespearean", label: "Shakespeare", blurb: "Elizabethan tragedy", featured: false },
];
const LEGACY_PERSONA = { classic: "staff_engineer", techbro: "chaos_intern" };
export const DEFAULT_PERSONA = "staff_engineer";

export function normalizeIntensity(raw, fallback = DEFAULT_INTENSITY) {
  const v = String(raw || "").toLowerCase().trim();
  if (INTENSITIES.some((i) => i.key === v)) return v;
  return LEGACY_INTENSITY[v] || fallback;
}
export function normalizePersona(raw, fallback = DEFAULT_PERSONA) {
  const v = String(raw || "").toLowerCase().trim();
  if (PERSONAS.some((p) => p.key === v)) return v;
  return LEGACY_PERSONA[v] || fallback;
}
export const intensityLabel = (raw) => INTENSITIES.find((i) => i.key === normalizeIntensity(raw))?.label || "Crispy";
export const personaLabel = (raw) => PERSONAS.find((p) => p.key === normalizePersona(raw))?.label || "Staff engineer";
