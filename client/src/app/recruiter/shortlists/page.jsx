"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/utils/toast";
import { listShortlists, createShortlist, updateShortlist, deleteShortlist } from "@/services/recruiterService";
import { Avatar, StateCard } from "@/components/recruiter/parts";

export default function Shortlists() {
  const { getToken } = useAuth();
  const [lists, setLists] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(() => listShortlists(getToken()).then((r) => setLists(r.shortlists)).catch(() => setError(true)), [getToken]);
  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!name.trim()) return toast.warning("Name your shortlist", { description: "For example: Senior systems IC." });
    try { await createShortlist(getToken(), { name }); setName(""); toast.success("Shortlist created"); load(); }
    catch (err) { toast.error("Could not create the shortlist", { description: err.message }); }
  }
  async function removeMember(l, m) {
    try { await updateShortlist(getToken(), l.id, { remove: [m] }); load(); }
    catch { toast.error("Could not update the shortlist"); }
  }
  async function removeList(l) {
    try { await deleteShortlist(getToken(), l.id); load(); toast.info("Shortlist deleted"); }
    catch { toast.error("Could not delete the shortlist"); }
  }

  return (
    <div className="rc-page">
      <p className="gr-eyebrow">Shortlists</p>
      <h1 className="gr-h1 rc-title">One list per role. Evidence stays attached.</h1>
      <form onSubmit={create} className="rc-filters">
        <div className="rc-field rc-field--grow">
          <label className="gr-label" htmlFor="sl-name">New shortlist</label>
          <input id="sl-name" className="gr-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Senior systems IC" maxLength={80} />
        </div>
        <button type="submit" className="gr-btn gr-btn--primary rc-filters__go">Create shortlist</button>
      </form>
      {error && <StateCard tone="error" tag="Error" title="Shortlists are unavailable" text="Nothing was changed." />}
      {!error && lists === null && <StateCard tone="loading" tag="Loading" title="Loading shortlists" />}
      {lists && !lists.length && <StateCard tag="Empty" title="No shortlists yet" text="Create one above, then add profiles from the talent search." />}
      <div className="rc-list">
        {lists?.map((l) => (
          <section key={l.id} className="gr-card">
            <div className="rc-list-item">
              <h2 className="rc-card-title">{l.name} <span className="gr-pill gr-pill--ember">{l.members.length} people</span></h2>
              <span className="rc-actions">
                {l.members.length >= 2 && <Link className="rc-link" href={`/recruiter/compare?u=${l.members.slice(0, 4).join(",")}&role=${l.roleKey}`}>Compare</Link>}
                <button type="button" className="gr-btn gr-btn--outline" onClick={() => removeList(l)}>Delete</button>
              </span>
            </div>
            {l.members.length === 0 && <p className="gr-help">No one added yet.</p>}
            {l.members.map((m) => (
              <div key={m} className="rc-list-item rc-mini-row">
                <span className="rc-cand"><Avatar name={m} size={36} /><Link href={`/recruiter/talent/${m}?role=${l.roleKey}`} className="rc-link">{m}</Link></span>
                <button type="button" className="gr-btn gr-btn--quiet" onClick={() => removeMember(l, m)}>Remove</button>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
