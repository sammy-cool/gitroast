"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/utils/toast";
import { listSaved, unsaveTalent } from "@/services/recruiterService";
import { Avatar, StateCard } from "@/components/recruiter/parts";

export default function SavedTalent() {
  const { getToken } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => listSaved(getToken()).then((r) => setItems(r.saved)).catch(() => setError(true)), [getToken]);
  useEffect(() => { load(); }, [load]);

  async function remove(u) {
    try { await unsaveTalent(getToken(), u); setItems((s) => s.filter((x) => x.username !== u)); }
    catch { toast.error("Could not remove this profile", { description: "Please try again." }); }
  }

  return (
    <div className="rc-page">
      <p className="gr-eyebrow">Saved talent</p>
      <h1 className="gr-h1 rc-title">Profiles you are keeping an eye on.</h1>
      {error && <StateCard tone="error" tag="Error" title="Saved talent is unavailable" text="Nothing was changed."><button type="button" className="gr-btn gr-btn--outline" onClick={() => { setError(false); load(); }}>Retry</button></StateCard>}
      {!error && items === null && <StateCard tone="loading" tag="Loading" title="Loading saved talent" />}
      {items && !items.length && <StateCard tag="Empty" title="No saved talent yet" text="Bookmark a profile from the talent search to keep it here."><Link href="/recruiter" className="gr-btn gr-btn--primary">Search talent</Link></StateCard>}
      <div className="rc-list">
        {items?.map((s) => (
          <div key={s.username} className="gr-card rc-list-item">
            <span className="rc-cand"><Avatar name={s.username} /><span><b>{s.username}</b><small className="gr-mono">@{s.username} • saved {new Date(s.savedAt).toLocaleDateString()}</small></span></span>
            <span className="rc-actions">
              <Link href={`/recruiter/talent/${s.username}`} className="rc-link">Profile</Link>
              <button type="button" className="gr-btn gr-btn--outline" onClick={() => remove(s.username)}>Remove</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
