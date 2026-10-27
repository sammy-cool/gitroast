# Plan: move toast colours from per-call options to the package theme (CSS variables)

**Status: deliberately deferred.** Nothing is wrong today; this is a cleanliness change with no visible effect.

## Why not now
- It cannot be verified without a browser: the package's CSS-variable names are not documented in the README, and inline per-toast colours currently override any variable we would set.
- Toasts are working in production-like conditions only after you have looked at them once; changing their styling mechanism before that removes the baseline.

## When
After the production smoke test passes and you have seen the toasts (icons, colours, mobile limit of 2) look right. Do it as one small PR.

## How (about 30 minutes)
1. Run `node scripts/toast-api.js` — it now also lists every CSS custom property in the package stylesheet.
2. Map them in `client/src/styles/ds.css` under `.gr-toast--success|error|warning|info|ember|loading`, using tokens (`--mint`, `--error-tint`, `--gold-tint`, `--blue`, `--ember-tint`, `--ink`).
3. In `client/src/utils/toastOptions.js` remove `backgroundColor`, `textColor`, `progressColor` from `buildToastOptions` (keep `className`, `icon`, `type`), and update `toastOptions.test.js` accordingly.
4. Check light/dark system themes and the reduced-motion setting, then screenshot all 15 `notify` moments.
5. Roll back by restoring the three options if any toast looks wrong.
