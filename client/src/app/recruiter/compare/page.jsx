"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { compareTalent } from "@/services/recruiterService";
import { Avatar, FitPill, SignalMeter, SIGNALS, StateCard } from "@/components/recruiter/parts";

function Inner() {
  const sp = useSearchParams();
  const names = (sp.get("u") || "").split(",").filter(Boolean);
  const role = sp.get("role") || "senior-ic";
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(names.length >= 2 ? "loading" : "empty");

  useEffect(() => {
    if (names.length < 2) return;
    let alive = true;
    compareTalent(getToken(), names, role).then((r) => alive && (setData(r), setStatus("ready"))).catch(() => alive && setStatus("error"));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  return (
    <div className="rc-page">
      <p className="gr-eyebrow">Compare</p>
      <h1 className="gr-h1 rc-title">Side by side, signal by signal.</h1>
      {status === "empty" && <StateCard tag="Empty" title="Pick two or more profiles" text="Select candidates in the talent search, then choose Compare selected."><Link href="/recruiter" className="gr-btn gr-btn--primary">Go to talent</Link></StateCard>}
      {status === "loading" && <StateCard tone="loading" tag="Loading" title="Comparing public evidence" />}
      {status === "error" && <StateCard tone="error" tag="Error" title="Could not compare these profiles" text="One may be private or not analyzed yet." />}
      {status === "ready" && (
        <div className="rc-compare">
          <div className="rc-compare__grid">
            {data.candidates.map((c) => (
              <section key={c.username} className="gr-card">
                <div className="rc-cand"><Avatar name={c.username} /><span><b>{c.username}</b><small className="gr-mono">{c.handle}</small></span></div>
                <p className="rc-bigscore">{c.fit.score ?? "—"}</p>
                <FitPill fit={c.fit} />
                <div className="rc-meters">{SIGNALS.map((s) => <SignalMeter key={s.key} label={s.label} tone={s.tone} signal={c.signals[s.key]} />)}</div>
                <Link className="rc-link" href={`/recruiter/talent/${c.username}?role=${role}`}>Open profile →</Link>
              </section>
            ))}
          </div>
          <p className="gr-help">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
