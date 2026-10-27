import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { INTENSITIES, PERSONAS, normalizeIntensity, normalizePersona } from "../vocab.js";

const require = createRequire(import.meta.url);
const shared = require("../../../../shared/constants.js");

describe("client vocab stays in sync with shared/constants", () => {
  it("intensity keys match", () => assert.deepEqual(INTENSITIES.map((i) => i.key), shared.INTENSITY_LEVELS));
  it("persona keys match", () => assert.deepEqual(PERSONAS.map((p) => p.key), shared.PERSONA_IDS));
  it("featured personas match", () =>
    assert.deepEqual(PERSONAS.filter((p) => p.featured).map((p) => p.key), shared.PERSONAS.filter((p) => p.featured).map((p) => p.id)));
  it("normalisers agree on legacy values", () => {
    for (const v of ["mild", "savage", "nuclear", "bogus", undefined]) assert.equal(normalizeIntensity(v), shared.normalizeIntensity(v));
    for (const v of ["classic", "techbro", "ramsay", "bogus", undefined]) assert.equal(normalizePersona(v), shared.normalizePersona(v));
  });
});

import { defaultWrappedYear } from "../wrapped.js";
describe("wrapped year stays in sync with shared/constants", () => {
  it("matches for every month of 2026", () => {
    for (let m = 0; m < 12; m++) {
      const d = new Date(Date.UTC(2026, m, 15));
      assert.equal(defaultWrappedYear(d), shared.defaultWrappedYear(d));
    }
    assert.equal(defaultWrappedYear(new Date("2026-10-24T00:00:00Z")), 2026);
    assert.equal(defaultWrappedYear(new Date("2026-03-01T00:00:00Z")), 2025);
  });
});
