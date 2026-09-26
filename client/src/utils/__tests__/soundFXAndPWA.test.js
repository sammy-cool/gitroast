// ============================================================
// GITROAST — Sound FX & PWA Contract Tests
// ============================================================
/**
 * WHAT: Unit and contract tests for SoundFX utility and PWA web app manifest.
 * WHY: Ensures audio synthesizer state handles missing AudioContext safely (SSR / headless),
 *      preserves user mute preference in localStorage, and verifies PWA manifest conforms
 *      to W3C Web App Manifest specifications for installability.
 * WHERE & WHEN TO USE: Executed as part of client test suite (`npm test --prefix client`).
 * USE CASES: CI/CD test runner verification of Sound FX engine and PWA manifest assets.
 * WHEN NOT TO USE: Do not play real hardware audio in headless CI environments.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isMuted,
  setMuted,
  toggleMute,
  playClick,
  playSuccess,
  playFireSizzle,
  playBurn,
} from "../soundFX.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Sound FX & Audio Delight Engine", () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    global.window = {
      localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; },
      },
    };
  });

  afterEach(() => {
    delete global.window;
  });

  it("should default to unmuted when no localStorage key exists", () => {
    assert.equal(isMuted(), false);
  });

  it("should toggle mute state and update localStorage", () => {
    const newState = toggleMute();
    assert.equal(newState, true);
    assert.equal(isMuted(), true);
    assert.equal(mockStorage["gitroast_sound_muted"], "1");

    const secondToggle = toggleMute();
    assert.equal(secondToggle, false);
    assert.equal(isMuted(), false);
    assert.equal(mockStorage["gitroast_sound_muted"], undefined);
  });

  it("should set mute state explicitly", () => {
    setMuted(true);
    assert.equal(isMuted(), true);
    assert.equal(mockStorage["gitroast_sound_muted"], "1");

    setMuted(false);
    assert.equal(isMuted(), false);
    assert.equal(mockStorage["gitroast_sound_muted"], undefined);
  });

  it("should fail gracefully when AudioContext is unavailable (headless or SSR)", () => {
    // None of these should throw in headless Node.js
    assert.doesNotThrow(() => playClick());
    assert.doesNotThrow(() => playSuccess());
    assert.doesNotThrow(() => playFireSizzle());
    assert.doesNotThrow(() => playBurn());
  });
});

describe("Progressive Web App (PWA) Manifest & Service Worker", () => {
  const publicDir = path.resolve(__dirname, "../../../public");

  it("should have a valid W3C manifest.json with required install fields", () => {
    const manifestPath = path.join(publicDir, "manifest.json");
    assert.ok(fs.existsSync(manifestPath), "manifest.json must exist in client/public");

    const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestRaw);

    assert.equal(manifest.name, "GitRoast — AI GitHub Roaster");
    assert.equal(manifest.short_name, "GitRoast");
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.theme_color, "#FF4500");
    assert.equal(manifest.background_color, "#070707");
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest must declare icons");
  });

  it("should have a valid sw.js service worker with lifecycle event listeners", () => {
    const swPath = path.join(publicDir, "sw.js");
    assert.ok(fs.existsSync(swPath), "sw.js must exist in client/public");

    const swContent = fs.readFileSync(swPath, "utf-8");
    assert.match(swContent, /addEventListener\(['"]install['"]/);
    assert.match(swContent, /addEventListener\(['"]activate['"]/);
    assert.match(swContent, /addEventListener\(['"]fetch['"]/);
  });

  it("should have a brand icon.svg in client/public", () => {
    const iconPath = path.join(publicDir, "icon.svg");
    assert.ok(fs.existsSync(iconPath), "icon.svg must exist in client/public");

    const iconContent = fs.readFileSync(iconPath, "utf-8");
    assert.match(iconContent, /<svg/);
  });
});
