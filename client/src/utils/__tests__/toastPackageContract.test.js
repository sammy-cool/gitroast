// Run after `npm install`: guards the exact package API this app relies on (works with any 3.x).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

let pkg = null;
try { pkg = await import("customizable-toast-notification"); } catch { /* not installed here */ }

describe("customizable-toast-notification contract", { skip: !pkg && "package not installed" }, () => {
  for (const name of ["createToast", "toastPromise", "dismiss", "setDefaultColors", "setDefaultMessages"]) {
    it(`exports ${name}`, () => assert.equal(typeof pkg[name], "function"));
  }
});
