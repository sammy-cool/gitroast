"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { notify, toast } from "@/utils/toast";
import { searchTalent, saveTalent, unsaveTalent, listShortlists, createShortlist, updateShortlist } from "@/services/recruiterService";
import { Avatar, FitPill, BookmarkButton, StateCard, PrivacyCards, SIGNALS } from "@/components/recruiter/parts";

const ROLES = [
  ["senior-ic", "Senior IC"],
  ["staff-ic", "Staff IC"],
  ["mid-ic", "Mid-level IC"],
  ["junior-ic", "Junior IC"],
];

export default function TalentWorkspace() {
  const router = useRouter();
  const { getToken, user } = useAuth();
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [windowMonths, setWindowMonths] = useState("12");
  const [minFit, setMinFit] = useState("0");
  const [showMore, setShowMore] = useState(false);
  const [explain, setExplain] = useState(false);
  const [role, setRole] = useState("senior-ic");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [selected, setSelected] = useState([]);
  const [lists, setLists] = useState([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [res, sl] = await Promise.all([searchTalent(getToken(), { q, role, language, window: windowMonths }), listShortlists(getToken())]);
      setData(res);
      setLists(sl.shortlists || []);
      setStatus("ready");
    } catch (err) {
      if (err.status === 401) return notify.sessionExpired({ onAction: () => router.push("/auth?role=recruiter") });
      setStatus("error");
    }
  }, [getToken, q, role, language, router]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [role, windowMonths]);

  async function toggleSave(c) {
    const next = !c.saved;
    setData((d) => ({ ...d, results: d.results.map((r) => (r.username === c.username ? { ...r, saved: next } : r)) }));
    try {
      await (next ? saveTalent(getToken(), c.username) : unsaveTalent(getToken(), c.username));
    } catch {
      setData((d) => ({ ...d, results: d.results.map((r) => (r.username === c.username ? { ...r, saved: !next } : r)) }));
      toast.error("Could not update saved talent", { description: "Please try again." });
    }
  }

  async function addToShortlist() {
    const members = selected.map((s) => s.toLowerCase());
    if (!members.length) return toast.info("Select profiles first", { description: "Tick one or more candidates to add them to a shortlist." });
    try {
      if (lists[0]) await updateShortlist(getToken(), lists[0].id, { add: members });
      else await createShortlist(getToken(), { name: `${data?.role?.label || "Role"} shortlist`, roleKey: role, members });
      toast.success("Shortlist updated", { description: `${members.length} profile${members.length > 1 ? "s" : ""} added.` });
      setSelected([]);
      load();
    } catch {
      toast.error("Could not update the shortlist", { description: "Please try again." });
    }
  }

  const toggleSelect = (u) => setSelected((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u]));
  const pair = useMemo(() => (data?.results || []).filter((r) => selected.includes(r.username)).slice(0, 2), [data, selected]);
  const summary = data?.summary;
  const extraFilters = (language ? 1 : 0) + (minFit !== "0" ? 1 : 0);
  const visible = (data?.results || []).filter((r) => Number(minFit) === 0 || (r.fit.score ?? -1) >= Number(minFit));
  const list0 = lists[0];

  return (
    <div className="rc-page">
      <header className="rc-head">
        <div>
          <p className="gr-eyebrow">{user?.organization || "Recruiter workspace"} • Public evidence</p>
          <h1 className="gr-h1 rc-title">Talent evidence, without the theater.</h1>
        </div>
        <div className="rc-head__actions">
          <Link href="/recruiter/methodology" className="gr-btn gr-btn--outline"><Icon name="book" /> Methodology</Link>
          <Link href="/recruiter/shortlists" className="gr-btn gr-btn--primary"><Icon name="plus" /> New shortlist</Link>
        </div>
      </header>

      <form className="rc-filters" onSubmit={(e) => { e.preventDefault(); load(); }} role="search">
        <div className="rc-field rc-field--grow">
          <label className="gr-label" htmlFor="rc-q">Search public profiles or repositories</label>
          <input id="rc-q" className="gr-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by handle…" />
        </div>
        <div className="rc-field">
          <label className="gr-label" htmlFor="rc-role">Role fit</label>
          <select id="rc-role" className="gr-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="rc-field">
          <label className="gr-label" htmlFor="rc-window">Evidence window</label>
          <select id="rc-window" className="gr-input" value={windowMonths} onChange={(e) => setWindowMonths(e.target.value)}>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
            <option value="0">Any time</option>
          </select>
        </div>
        <button type="button" className="gr-btn gr-btn--outline rc-filters__go" aria-expanded={showMore} aria-controls="rc-more" onClick={() => setShowMore((v) => !v)}>
          <Icon name="list" /> More filters{extraFilters > 0 ? ` · ${extraFilters}` : ""}
        </button>
        <button type="submit" className="gr-btn gr-btn--dark rc-filters__go"><Icon name="search" /> Search</button>
        {showMore && (
          <div id="rc-more" className="rc-more">
            <div className="rc-field">
              <label className="gr-label" htmlFor="rc-lang">Primary language</label>
              <input id="rc-lang" className="gr-input" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Any" />
            </div>
            <div className="rc-field">
              <label className="gr-label" htmlFor="rc-minfit">Minimum fit</label>
              <select id="rc-minfit" className="gr-input" value={minFit} onChange={(e) => setMinFit(e.target.value)}>
                <option value="0">Any fit</option>
                <option value="70">Good and above (70+)</option>
                <option value="85">Strong only (85+)</option>
              </select>
            </div>
            <button type="button" className="gr-btn gr-btn--quiet" onClick={() => { setLanguage(""); setMinFit("0"); }}>Clear extra filters</button>
          </div>
        )}
      </form>

      <section className="rc-stats" aria-label="Workspace summary">
        {[
          ["Evidence profiles", summary?.evidenceProfiles ?? "—", "Matched current filters"],
          ["Saved talent", summary?.savedTalent ?? "—", "In your workspace"],
          ["Shortlists", summary?.shortlists ?? "—", "Role-based lists"],
          ["Method coverage", summary ? (summary.methodCoverage >= 80 ? "High" : summary.methodCoverage >= 40 ? "Medium" : "Low") : "—", summary ? `${summary.methodCoverage}% with enough evidence` : "Waiting for results"],
        ].map(([k, v, s]) => (
          <div key={k} className="gr-card rc-stat">
            <span className="gr-eyebrow rc-stat__k">{k}</span>
            <b className="rc-stat__v">{v}</b>
            <span className="gr-help">{s}</span>
          </div>
        ))}
      </section>

      <div className="rc-cols">
        <section className="gr-card rc-table-card" aria-labelledby="rc-results">
          <div className="rc-table-head">
            <div>
              <h2 id="rc-results" className="rc-card-title">Role-fit results</h2>
              <p className="gr-help">Ranked by selected public evidence signals, not identity or popularity.</p>
              <button type="button" className="gr-pill gr-pill--blue rc-explain" aria-expanded={explain} aria-controls="rc-explain" onClick={() => setExplain((v) => !v)}>Explain ranking</button>
            </div>
            <Link href={pair.length === 2 ? `/recruiter/compare?u=${pair.map((p) => p.username).join(",")}&role=${role}` : "/recruiter/compare"} className="gr-btn gr-btn--outline" aria-disabled={selected.length < 2}>
              Compare selected
            </Link>
          </div>

          {explain && data?.role?.weights && (
            <div id="rc-explain" className="rc-explain-card" role="note">
              <b>How {data.role.label} fit is computed</b>
              <p className="gr-help">
                Project depth {Math.round(data.role.weights.depth * 100)}%, collaboration {Math.round(data.role.weights.collaboration * 100)}%, documentation {Math.round(data.role.weights.documentation * 100)}%, consistency {Math.round(data.role.weights.consistency * 100)}%.
                A signal without enough public evidence is left out and the remaining weights are renormalized, so sparse activity is never treated as a low score. Humor from roasts is not an input. <Link href="/recruiter/methodology" className="rc-link">Full methodology</Link>
              </p>
            </div>
          )}

          {status === "loading" && <StateCard tone="loading" tag="Loading" title="Reading public evidence" text="Candidates appear in a moment." />}
          {status === "error" && <StateCard tone="error" tag="Error" title="Talent evidence is unavailable" text="Nothing was changed. Try again in a moment."><button type="button" className="gr-btn gr-btn--outline" onClick={load}>Retry</button></StateCard>}
          {status === "ready" && !visible.length && <StateCard tag="Empty" title="No public evidence matched" text="Try a broader search, or clear the language filter. Only opted-in public profiles appear here." />}

          {status === "ready" && visible.length > 0 && (
            <div className="rc-table" role="table" aria-label="Role-fit results">
              <div className="rc-row rc-row--head" role="row">
                <span role="columnheader">Candidate</span><span role="columnheader">Role evidence</span><span role="columnheader">Fit</span><span role="columnheader">Actions</span>
              </div>
              {visible.map((c) => (
                <div key={c.username} className="rc-row" role="row">
                  <span className="rc-cand" role="cell">
                    <input type="checkbox" className="rc-check" checked={selected.includes(c.username)} onChange={() => toggleSelect(c.username)} aria-label={`Select ${c.username} for comparison`} />
                    <Avatar name={c.username} />
                    <span><b>{c.username}</b><small className="gr-mono">{c.handle}</small></span>
                  </span>
                  <span className="rc-ev" role="cell">
                    {c.topLanguage || "Mixed"}
                    <small>{SIGNALS.filter((s) => typeof c.signals[s.key]?.value === "number").slice(0, 2).map((s) => `${s.label.replace("Project ", "")} ${c.signals[s.key].value}`).join(" • ") || "Insufficient evidence"}</small>
                  </span>
                  <span className="rc-fit" role="cell">
                    <b>{c.fit.score ?? "—"}</b>
                    <FitPill fit={c.fit} />
                  </span>
                  <span className="rc-actions" role="cell">
                    <BookmarkButton saved={c.saved} label={c.username} onToggle={() => toggleSave(c)} />
                    <Link href={`/recruiter/talent/${c.username}?role=${role}`} className="rc-link">Profile</Link>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="rc-rail">
          <section className="gr-card gr-card--dark" aria-label="Shortlist">
            <div className="rc-rail__top">
              <span className="gr-eyebrow rc-on-dark">Shortlist</span>
              {list0 && <span className="gr-pill gr-pill--ember">{list0.members.length} people</span>}
            </div>
            <h2 className="gr-h3 rc-on-dark">{list0?.name || "No shortlist yet"}</h2>
            {list0?.members.slice(0, 3).map((m) => (
              <div key={m} className="rc-mini"><Avatar name={m} size={36} /><span>{m}</span></div>
            ))}
            {selected.length > 0 && <button type="button" className="gr-btn gr-btn--outline gr-btn--block" onClick={addToShortlist}>Add {selected.length} selected</button>}
            <Link href="/recruiter/shortlists" className="gr-btn gr-btn--primary gr-btn--block"><Icon name="arrow" /> Open shortlist</Link>
          </section>

          <section className="gr-card" aria-label="Comparison snapshot">
            <p className="gr-eyebrow">Comparison snapshot</p>
            {pair.length === 2 ? (
              <>
                <h2 className="rc-card-title">{pair[0].username} vs {pair[1].username}</h2>
                {SIGNALS.map((s) => (
                  <div key={s.key} className="gr-meter rc-snap">
                    <div className="gr-meter__head"><span>{s.label}</span><b>{pair[0].signals[s.key]?.value ?? "—"} / {pair[1].signals[s.key]?.value ?? "—"}</b></div>
                    <div className="gr-meter__track"><div className={`gr-meter__fill${s.tone ? ` gr-meter__fill--${s.tone}` : ""}`} style={{ width: `${pair[0].signals[s.key]?.value ?? 0}%` }} /></div>
                  </div>
                ))}
                <p className="gr-help">Comparison supports review; it does not recommend a hiring decision.</p>
                <Link href={`/recruiter/compare?u=${pair.map((p) => p.username).join(",")}&role=${role}`} className="gr-btn gr-btn--outline gr-btn--block">Compare evidence</Link>
              </>
            ) : (
              <p className="gr-help">Tick two candidates to see their evidence side by side.</p>
            )}
          </section>
        </aside>
      </div>

      <PrivacyCards />
    </div>
  );
}
