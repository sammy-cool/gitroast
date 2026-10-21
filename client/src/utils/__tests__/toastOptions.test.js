import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildToastOptions, resolveDuration, escapeHtml, cleanCopy, hoursUntil, iconFor, globalConfig, PERSIST_MS } from "../toastOptions.js";

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
  it("formats reset times", () => {
    const now = Date.UTC(2026, 9, 18, 18, 0, 0);
    assert.equal(hoursUntil(new Date(now + 6 * 36e5).toISOString(), now), "6 hours");
    assert.equal(hoursUntil(new Date(now + 10 * 60e3).toISOString(), now), "under an hour");
    assert.equal(hoursUntil(null, now), "a few hours");
    assert.equal(hoursUntil("garbage", now), "a few hours");
    assert.equal(hoursUntil(new Date(now - 1000).toISOString(), now), "a few hours");
  });
  it("passes design status icons (SVG, coloured per type); loading uses the spinner", () => {
    for (const type of ["success", "error", "warning", "info", "ember"]) {
      const { options } = buildToastOptions({ type, title: "x" });
      assert.match(options.icon, /^<svg[^>]+viewBox="0 0 24 24"/, `${type} icon is an SVG string`);
      assert.ok(options.icon.includes('stroke-width="1.75"'));
    }
    assert.ok(iconFor("success").includes("#1F6B3D"));
    assert.ok(iconFor("error").includes("#B3261E"));
    assert.equal(iconFor("loading"), false);
    assert.equal(buildToastOptions({ type: "loading", title: "x" }).options.icon, false);
    assert.equal(buildToastOptions({ type: "loading", title: "x" }).options.showLoader, true);
  });
  it("global config follows the spec (3 desktop / 2 mobile, queue 5, top-center)", () => {
    assert.deepEqual(globalConfig(), { maxVisible: 3, maxQueueSize: 5, defaultPosition: "top-center", reducedMotion: "auto", pauseOnHover: true, sound: false });
    assert.equal(globalConfig({ mobile: true }).maxVisible, 2);
  });
});
