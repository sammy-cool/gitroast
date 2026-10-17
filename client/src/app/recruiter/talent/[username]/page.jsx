"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { toast, notify } from "@/utils/toast";
import { getCandidate, saveTalent, unsaveTalent } from "@/services/recruiterService";
import { Avatar, SignalMeter, SIGNALS, StateCard } from "@/components/recruiter/parts";
import TrendBars from "@/components/TrendBars";

export default function CandidateProfile({ params }) {
  const { username } = use(params);
  const role = useSearchParams().get("role") || "senior-ic";
  const { getToken } = useAuth();
  const [d, setD] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    getCandidate(getToken(), username, role)
      .then((res) => { if (alive) { setD(res); setSaved(res.candidate.saved); setStatus("ready"); } })
      .catch((e) => alive && setStatus(e.status === 404 ? "missing" : "error"));
    return () => { alive = false; };
  }, [username, role, getToken]);

  if (status === "loading") return <StateCard tone="loading" tag="Loading" title="Reading public evidence" />;
  if (status === "missing") return <StateCard tag="Not found" title="No public evidence for this profile" text="The profile may be private, opted out, or not analyzed yet."><Link href="/recruiter" className="gr-btn gr-btn--outline">Back to talent</Link></StateCard>;
  if (status === "error") return <StateCard tone="error" tag="Error" title="Could not load this profile" text="Nothing was changed. Try again shortly." />;

  const c = d.candidate;
  const weights = d.role.weights;
  const snap = d.snapshot || {};
  const pct = (k) => Math.round((weights[k] || 0) * 100);
  const collab = snap.collab;
  const topRepos = snap.topRepos || [];
  const trendValues = (d.trend || []).map((t) => t.score);
  const trendLabels = (d.trend || []).map((t) => new Date(t.at).toLocaleDateString(undefined, { month: "short" }));
  const reviewLevel = collab ? (collab.reviews >= 20 ? "High" : collab.reviews >= 5 ? "Moderate" : collab.reviews > 0 ? "Some" : "None visible") : "Unknown";

  async function toggle() {
    const next = !saved;
    setSaved(next);
    try { await (next ? saveTalent(getToken(), c.username) : unsaveTalent(getToken(), c.username)); }
    catch { setSaved(!next); notify.sessionExpired({ what: "this profile" }); }
  }

  function brief() {
    const lines = [
      `# Evidence summary — @${c.username}`,
      `Role model: ${d.role.label} (${d.model})`,
      `Fit: ${c.fit.score ?? "insufficient evidence"} (${c.fit.label}), evidence coverage ${c.fit.coverage}%`,
      "",
      ...SIGNALS.map((s) => `- ${s.label}: ${typeof c.signals[s.key]?.value === "number" ? c.signals[s.key].value : "insufficient public evidence"} (${c.signals[s.key]?.source})`),
      "",
      `Public repositories: ${snap.totalRepos ?? 0}; abandoned: ${snap.abandonedCount ?? 0}; stars: ${snap.totalStars ?? 0}.`,
      snap.collab ? `Public collaboration (last ${snap.collab.windowMonths || 12} months): ${snap.collab.prs} pull requests, ${snap.collab.reviews} reviews, ${snap.collab.externalRepos} other owners.` : "Public collaboration: insufficient evidence.",
      ...(snap.topRepos || []).map((r) => `Notable project: ${r.name} (${r.stars} stars) - ${r.description || "no description"}`),
      "",
      "Evidence alignment, not a hiring recommendation. No contact details are inferred.",
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(() => notify.copied({ what: "Evidence brief" })).catch(() => toast.error("Could not copy the brief"));
  }

  function share() {
    navigator.clipboard?.writeText(window.location.href).then(() => notify.copied({ what: "Evidence link" })).catch(() => {});
  }

  return (
    <div className="rc-page">
      <p className="rc-crumb"><Link href="/recruiter">Talent</Link> / {d.role.label} / {c.username}</p>

      <section className="gr-card rc-profile-head">
        <div className="rc-profile-id">
          <Avatar name={c.username} size={76} />
          <div>
            <h1 className="gr-h1 rc-name">{c.username} <span className="gr-pill gr-pill--mint">Public profile</span></h1>
            <p className="gr-mono rc-sub">{c.handle} • {c.topLanguage || "Mixed"} • {c.publicRepositories} public repositories</p>
            <div className="rc-chips">
              {SIGNALS.filter((s) => typeof c.signals[s.key]?.value === "number").map((s) => (
                <span key={s.key} className={`gr-pill gr-pill--${s.tone || "ember"}`}>{s.label} {c.signals[s.key].value}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="rc-head__actions">
          <button type="button" className="gr-btn gr-btn--outline" onClick={share}><Icon name="share" /> Share evidence</button>
          <button type="button" className="gr-btn gr-btn--primary" aria-pressed={saved} onClick={toggle}><Icon name="bookmark" /> {saved ? "Saved" : "Save to shortlist"}</button>
        </div>
      </section>

      <div className="rc-cols rc-cols--profile">
        <div className="rc-stack">
        <section className="gr-card" aria-labelledby="fit-h">
          <div className="rc-fit-head">
            <div>
              <p className="gr-eyebrow">Role-fit evidence</p>
              <h2 id="fit-h" className="gr-h2">{c.fit.score == null ? "Not enough public evidence" : c.fit.label === "Strong" ? "Strong match, with context." : c.fit.label === "Good" ? "Good match, with context." : "Emerging match, with context."}</h2>
            </div>
            <b className="rc-bigscore">{c.fit.score ?? "—"}</b>
          </div>
          <div className="rc-meters">
            {SIGNALS.map((s) => <SignalMeter key={s.key} label={s.label} tone={s.tone} signal={c.signals[s.key]} />)}
          </div>
          <p className="gr-help">This is evidence alignment, not a hiring recommendation. Sparse private work is not inferred.</p>
        </section>
        <section className="gr-card" aria-labelledby="sig-h">
          <p className="gr-eyebrow">Public signals</p>
          <h2 id="sig-h" className="gr-h3">What the public work shows</h2>
          <ul className="rc-signals">
            <li><b>{snap.totalRepos ?? 0} public repositories</b><span>{snap.abandonedCount ?? 0} look abandoned; {(snap.totalRepos ?? 0) - (snap.abandonedCount ?? 0)} appear maintained.</span></li>
            <li><b>{snap.totalStars ?? 0} stars received</b><span>Public signal; popularity does not decide the fit score on its own.</span></li>
            <li><b>{snap.hasReadme ? "README present" : "No README on the profile repository"}</b><span>Used for the documentation signal.</span></li>
          </ul>
        </section>
        <section className="gr-card" aria-labelledby="proj-h">
          <p className="gr-eyebrow">Project depth</p>
          <h2 id="proj-h" className="gr-h3">Notable public projects</h2>
          {topRepos.length === 0 ? (
            <p className="gr-help">Project details appear after this profile is analyzed again.</p>
          ) : (
            <ul className="rc-signals">
              {topRepos.map((r) => (
                <li key={r.name}>
                  <b>{r.name} <span className="gr-mono rc-sub">{r.stars} stars{r.language ? ` • ${r.language}` : ""}</span></b>
                  <span>{r.description || "No description provided."}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="gr-card" aria-labelledby="grow-h">
          <p className="gr-eyebrow">Growth signals</p>
          <h2 id="grow-h" className="gr-h3">Visible change over time</h2>
          <TrendBars values={trendValues} labels={trendLabels} ariaLabel="Public score trend" caption={trendValues.length >= 2 ? "Public roast scores • same methodology • oldest to newest" : ""} />
        </section>
        </div>
        <aside className="rc-rail">
        <section className="gr-card gr-card--blue">
          <h2 className="rc-card-title"><Icon name="book" /> Why {c.fit.score ?? "this score"}?</h2>
          <p className="gr-help">For this role: project depth {pct("depth")}%, collaboration {pct("collaboration")}%, documentation {pct("documentation")}%, consistency {pct("consistency")}%. Signals without evidence are excluded and the remaining weights are renormalized (coverage {c.fit.coverage}%).</p>
          <dl className="rc-kv">
            <div><dt>Sources</dt><dd>{c.publicRepositories} repos</dd></div>
            <div><dt>Model</dt><dd>{d.model}</dd></div>
            <div><dt>Analyzed</dt><dd>{c.analyzedAt ? new Date(c.analyzedAt).toLocaleDateString() : "—"}</dd></div>
          </dl>
          <Link href="/recruiter/methodology" className="gr-btn gr-btn--outline gr-btn--block">Open full methodology</Link>
        </section>
          <section className="gr-card" aria-labelledby="collab-h">
            <p className="gr-eyebrow">Collaboration indicators</p>
            <h2 id="collab-h" className="sr-only-h gr-sr-only">Collaboration indicators</h2>
            <dl className="rc-kv rc-kv--list">
              <div><dt>Review activity</dt><dd>{reviewLevel}<small>{collab ? `${collab.reviews} reviews` : "no data"}</small></dd></div>
              <div><dt>Pull requests</dt><dd>{collab ? collab.prs : "—"}<small>last {collab?.windowMonths || 12} months</small></dd></div>
              <div><dt>Contributor breadth</dt><dd>{collab ? (collab.externalRepos >= 5 ? "Strong" : collab.externalRepos >= 2 ? "Moderate" : collab.externalRepos > 0 ? "Some" : "None visible") : "—"}<small>{collab ? `${collab.externalRepos} other owners` : "no data"}</small></dd></div>
            </dl>
            <p className="gr-help">Public repositories only. Private or internal collaboration is not visible and is never penalized.</p>
          </section>
          <section className="gr-card gr-card--gold">
            <h2 className="rc-card-title">Questions for human review</h2>
            <p className="gr-help">Ask about team context, constraints and private work directly. Do not treat public activity volume as availability or motivation.</p>
          </section>
          <section className="gr-card gr-card--mint">
            <h2 className="rc-card-title"><Icon name="shield" /> Ethical use</h2>
            <p className="gr-help">Use this profile to prepare relevant questions — not to infer protected traits, employment status, location or personality.</p>
          </section>
          <section className="gr-card">
            <p className="gr-eyebrow">Outreach readiness</p>
            <h2 className="rc-card-title">Evidence summary ready</h2>
            <p className="gr-help">Generate a factual brief with sources. No auto-written flattery, no inferred contact details.</p>
            <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={brief}><Icon name="doc" /> Prepare outreach brief</button>
          </section>
        </aside>
      </div>
    </div>
  );
}
