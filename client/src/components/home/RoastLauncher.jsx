"use client";

import { useState } from "react";
import { INTENSITIES, PERSONAS } from "@/utils/vocab";
import { cleanGithubTarget, isGithubRepo, isGithubUser } from "@/utils/githubTarget";

export const cleanTarget = cleanGithubTarget

export default function RoastLauncher({ intensity, persona, user, onIntensity, onPersona, onSubmit }) {
  const [mode, setMode] = useState("profile");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  const featured = PERSONAS.filter((p) => p.featured);
  const more = PERSONAS.filter((p) => !p.featured);
  const moreActive = more.some((p) => p.key === persona);

  function submit(e) {
    e.preventDefault();
    const v = cleanTarget(value);
    if (!v) return setError("Enter a GitHub username or repository first.");
    const ok = mode === "repository" ? isGithubRepo(v) : isGithubUser(v);
    if (!ok) return setError(mode === "repository" ? "Use owner/repo, for example torvalds/linux." : "Use a public GitHub username, for example octavia-labs.");
    setError("");
    onSubmit(v);
  }

  return (
    <form className="gr-card home-launch" onSubmit={submit} noValidate aria-labelledby="launch-title" id="roast">
      <div className="home-launch__head">
        <h2 id="launch-title" className="gr-h3">Who are we roasting?</h2>
        <span className="gr-pill gr-pill--mint">System healthy</span>
      </div>

      <div className="gr-seg home-launch__seg" role="tablist" aria-label="Roast target">
        {[["profile", "Profile"], ["repository", "Repository"]].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setError(""); }}>
            {label}
          </button>
        ))}
      </div>

      <label className="gr-label" htmlFor="roast-target">
        {mode === "repository" ? "GitHub repository (owner/repo)" : "GitHub username or repository URL"}
      </label>
      <input
        id="roast-target"
        className="gr-input gr-mono"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={mode === "repository" ? "octavia-labs/ember" : "octavia-labs"}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={120}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "roast-target-error" : undefined}
      />
      {error && <p id="roast-target-error" className="gr-error" role="alert">{error}</p>}

      <fieldset className="home-launch__group">
        <legend className="gr-label">Intensity</legend>
        <div className="home-launch__chips">
          {INTENSITIES.map((i) => (
            <button key={i.key} type="button" className="gr-chip" aria-pressed={intensity === i.key} onClick={() => onIntensity(i.key)} title={i.description}>
              {i.label}
              {i.isPro && !user?.isPro ? <span className="gr-pill gr-pill--gold home-launch__pro">Pro</span> : null}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="home-launch__group">
        <legend className="gr-label">Roast persona</legend>
        <div className="home-launch__personas">
          {featured.map((p) => (
            <button key={p.key} type="button" className="home-persona" aria-pressed={persona === p.key} onClick={() => onPersona(p.key)}>
              <b>{p.label}</b>
              <span>{p.blurb}</span>
            </button>
          ))}
        </div>
        <button type="button" className="gr-btn gr-btn--quiet" aria-expanded={showMore || moreActive} onClick={() => setShowMore((v) => !v)}>
          {showMore || moreActive ? "Fewer voices" : "More voices"}
        </button>
        {(showMore || moreActive) && (
          <div className="home-launch__personas">
            {more.map((p) => (
              <button key={p.key} type="button" className="home-persona" aria-pressed={persona === p.key} onClick={() => onPersona(p.key)}>
                <b>{p.label}</b>
                <span>{p.blurb}</span>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <button type="submit" className="gr-btn gr-btn--primary gr-btn--block">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-1.7.8-3 1.7-4 .2 1.2.9 2 1.8 2.2C10.2 8.2 10.5 5.6 12 3z" /></svg>
        {mode === "repository" ? "Roast this repository" : "Roast this profile"}
      </button>
      <p className="gr-help home-launch__note">By continuing, you confirm this profile is public. Keep it playful.</p>
    </form>
  );
}
