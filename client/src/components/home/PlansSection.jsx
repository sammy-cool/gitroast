"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlans, formatPrice } from "@/services/roastService";

// Static fallback shown until (or if) the regional price list cannot be loaded.
const FALLBACK = {
  currency: "USD",
  plans: [
    { id: "free", name: "Free", amount: 0, tagline: "3 AI roasts / month", features: ["Public result", "Share card", "Community"] },
    { id: "roaster", name: "Pro Roaster", amount: 500, badge: "Most roasted", tagline: "30 AI roasts / month", features: ["History", "Personas", "Badges", "Ghost Mode"] },
    { id: "historian", name: "Historian", amount: 900, tagline: "Unlimited history + 200 AI roasts", features: ["Trend exports", "Comparison", "Priority analysis"] },
  ],
};

export function usePlans() {
  const [data, setData] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let alive = true;
    getPlans().then((d) => alive && d.plans.length && (setData(d), setLive(true))).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { ...data, live };
}

export default function PlansSection({ onChoose }) {
  const { plans, currency } = usePlans();
  return (
    <div className="home-plans">
      {plans.map((p) => {
        const featured = p.id === "roaster";
        return (
          <article key={p.id} className={`gr-card home-plan${featured ? " gr-card--dark" : ""}`}>
            <div className="home-plan__top">
              <h3 className="home-plan__name">{p.name}</h3>
              {p.badge && <span className="gr-pill gr-pill--ember">{p.badge}</span>}
            </div>
            <p className="home-plan__price">
              <span className={featured ? "home-plan__amt home-plan__amt--gold" : "home-plan__amt"}>{formatPrice(p.amount, p.currency || currency)}</span>
              <small>per month</small>
            </p>
            <p className="home-plan__tag">{p.tagline}</p>
            <p className="home-plan__features">{p.features.join(" • ")}</p>
            {p.id === "free" ? (
              <Link href="/#roast" className="gr-btn gr-btn--outline gr-btn--block">Start free</Link>
            ) : (
              <button type="button" className={`gr-btn gr-btn--block ${featured ? "gr-btn--primary" : "gr-btn--outline"}`} onClick={() => onChoose?.(p.id)}>
                {featured ? "Go Pro" : "Choose Historian"}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
