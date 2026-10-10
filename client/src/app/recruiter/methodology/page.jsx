"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMethodology } from "@/services/recruiterService";
import { StateCard } from "@/components/recruiter/parts";

export default function Methodology() {
  const { getToken } = useAuth();
  const [m, setM] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { getMethodology(getToken()).then(setM).catch(() => setErr(true)); }, [getToken]);

  return (
    <div className="rc-page">
      <p className="gr-eyebrow">Methodology</p>
      <h1 className="gr-h1 rc-title">How evidence is read.</h1>
      {err && <StateCard tone="error" tag="Error" title="Methodology is unavailable" />}
      {!m && !err && <StateCard tone="loading" tag="Loading" title="Loading methodology" />}
      {m && (
        <>
          <section className="gr-card gr-card--blue"><h2 className="rc-card-title">{m.version}</h2>
            <ul className="rc-method">{m.principles.map((p) => <li key={p}>{p}</li>)}</ul></section>
          <section className="gr-card"><h2 className="rc-card-title">Role models and weights</h2>
            {m.roles.map((r) => (
              <p key={r.id} className="rc-method-row"><b>{r.label}</b> — depth {Math.round(r.weights.depth * 100)}%, collaboration {Math.round(r.weights.collaboration * 100)}%, documentation {Math.round(r.weights.documentation * 100)}%, consistency {Math.round(r.weights.consistency * 100)}%</p>
            ))}
            <p className="gr-help">Collaboration needs pull-request and review data; until it is available it is labeled as insufficient evidence and excluded rather than guessed.</p>
          </section></>
      )}
    </div>
  );
}
