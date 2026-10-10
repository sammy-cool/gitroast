"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoastFeed } from "@/services/roastService";
import { intensityLabel } from "@/utils/vocab";

const initials = (u = "") => u.slice(0, 2).toUpperCase();

export default function LiveGrillBand() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => getRoastFeed().then((f) => alive && f?.length && setItems(f.slice(0, 3))).catch(() => {});
    load();
    const t = setInterval(() => !document.hidden && load(), 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!items.length) return null;
  return (
    <section className="home-band" aria-label="Live from the grill">
      <div className="home-band__inner">
        <span className="gr-eyebrow home-band__label">Live from the grill</span>
        {items.map((it) => (
          <Link key={it._id || it.id || it.username} href={`/history/${it.username}`} className="home-band__item">
            <span className="home-band__avatar" aria-hidden="true">{initials(it.username)}</span>
            <span>
              <b>{it.username} scored {it.score}</b>
              <small>Grade {it.grade} · {intensityLabel(it.intensity)}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
