import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildToastOptions, resolveDuration, escapeHtml, cleanCopy, PERSIST_MS } from "../toastOptions.js";

describe("toastOptions (design spec → package options)", () => {
  it("timing: success/info 5s, warning 7s, error/loading/actionable persist", () => {
    assert.equal(resolveDuration({ type: "success" }), 5000);
    assert.equal(resolveDuration({ type: "info" }), 5000);
    assert.equal(resolveDuration({ type: "warning" }), 7000);
    assert.equal(resolveDuration({ type: "error" }), PERSIST_MS);
    assert.equal(resolveDuration({ type: "loading" }), PERSIST_MS);
    assert.equal(resolveDuration({ type: "success", hasAction: true }), PERSIST_MS);
    assert.equal(resolveDuration({ type: "error", duration: 3000 }), 3000);
  });
  it("placement and controls", () => {
    const { options: o } = buildToastOptions({ type: "success", title: "Roast ready", description: "octavia-labs scored 84." });
    assert.equal(o.position, "top-center");
    assert.equal(o.maxWidth, "420px");
    assert.equal(o.showCloseButton, true);
    assert.equal(o.swipeToDismiss, true);
    assert.equal(o.pauseOnHover, true);
    assert.equal(o.showProgressBar, true);
    assert.match(o.message, /<strong>Roast ready<\/strong><br><small>octavia-labs scored 84\.<\/small>/);
  });
  it("persistent toasts hide the timer rail", () => {
    assert.equal(buildToastOptions({ type: "error", title: "GitHub blinked" }).options.showProgressBar, false);
  });
  it("maps legacy cta/message and keeps one verb action", () => {
    const fn = () => {};
    const { options: o } = buildToastOptions({ type: "info", message: "Hi", cta: { label: "Go", onClick: fn } });
    assert.equal(o.cta.label, "Go");
    assert.equal(o.cta.onClick, fn);
    assert.equal(o.cta.autoClose, true);
  });
  it("escapes HTML (messages go through allowHtml)", () => {
    const { options: o } = buildToastOptions({ type: "info", title: "<img src=x onerror=alert(1)>" });
    assert.ok(!o.message.includes("<img"));
    assert.equal(escapeHtml(`a<b>&"'`), "a&lt;b&gt;&amp;&quot;&#39;");
  });
  it("reduced motion uses a ≤100ms linear fade", () => {
    const { options: o } = buildToastOptions({ type: "info", title: "x" }, { reducedMotion: true });
    assert.equal(o.animationDuration, "0.1s");
    assert.equal(o.animationEasing, "linear");
  });
  it("strips decorative leading emoji", () => assert.equal(cleanCopy("🔥 Roast ready"), "Roast ready"));
  it("loading shows the package loader", () => assert.equal(buildToastOptions({ type: "loading", title: "Reading" }).options.showLoader, true));
});
