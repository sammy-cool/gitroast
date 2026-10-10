"use client";

import { useState } from "react";

export const FAQ_ITEMS = [
  ["What does GitRoast analyze?", "Public GitHub profile and repository evidence: commit patterns, project depth, documentation and visible collaboration."],
  ["Is Nuclear mode abusive?", "No. Intensity changes theatricality, not safety. We avoid identity, appearance and protected characteristics."],
  ["Can I remove or hide my profile?", "Yes. Ghost Mode controls discoverability, and public-page removal requests are available without a paid plan."],
  ["Is recruiter scoring the same as a roast?", "No. Professional insights use explainable, job-relevant public evidence and never surface playful roast copy."],
];

export default function Faq({ items = FAQ_ITEMS }) {
  const [open, setOpen] = useState(-1);
  return (
    <div className="home-faq">
      {items.map(([q, a], i) => (
        <div key={q} className="home-faq__item">
          <h3>
            <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{q}</span>
              <span aria-hidden="true">{open === i ? "−" : "+"}</span>
            </button>
          </h3>
          <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={open !== i}>
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
