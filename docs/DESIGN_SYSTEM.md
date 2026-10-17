# GitRoast design system — "Sunlit editorial arcade" (v1)

Source of truth: `client/src/styles/tokens.css` (roles) and `client/src/styles/ds.css` (primitives, prefix `gr-`).

## Build every new screen like this
1. Colors/spacing/radius only from tokens (`--paper --surface --ink --ember --gold --mint --blue --error-tint`, `--r-1..4`, `--shadow-1..3`). No hardcoded hex.
2. Type: headings `gr-h1/h2/h3` (Instrument Serif), UI text Inter, data/eyebrows IBM Plex Mono (`gr-eyebrow`, `gr-mono`).
3. Layout: public pages = `SiteHeader` + `gr-page`; signed-in tools = `gr-shell` (`gr-side` + `gr-main`) + mobile `gr-tabbar`.
4. Controls: `gr-btn` (--primary/--outline/--dark/--quiet), `gr-chip`, `gr-seg`, `gr-input`, `gr-pill--{ember|mint|blue|gold|error}`. Min target 44px, visible focus.
5. Surfaces: `gr-card` (+ `--dark/--mint/--blue/--gold/--ember`). Border first, shadow only for lift.
6. States are never blank: use `gr-state` (empty/loading/error/success) with a tag, a title and one action.
7. Feedback: only through `toast` / `notify` from `@/utils/toast`. Add new moments to the `notify` catalog (title, one-line consequence, optional verb action).
8. Motion: 120/220/480ms, ease-out; honour `prefers-reduced-motion` (tokens already zero the durations).
9. Copy voice: concise, specific, calm; humor never affects scores; never target identity.
10. When a page is migrated, add its path prefix to `MIGRATED` in `components/ThemeScope.jsx`.

## Vocabulary (single source of truth: `shared/constants.js`, mirrored in `client/src/utils/vocab.js`, kept in sync by a test)
- Intensity: `warm | crispy | nuclear` (legacy `mild/savage` accepted and normalised).
- Personas: `staff_engineer | chaos_intern | historian` (+ more voices `hinglish | ramsay | shakespearean`; legacy `classic/techbro` normalised).
