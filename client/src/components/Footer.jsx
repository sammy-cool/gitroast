"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { hidesSiteChrome } from "@/components/SiteHeader";

const COLUMNS = [
  { title: "Play", links: [["Roast", "/"], ["Battles", "/battle"], ["Universe", "/universe"]] },
  { title: "Discover", links: [["Wall of Shame", "/leaderboard"], ["Pricing", "/pricing"], ["Dashboard", "/dashboard"]] },
  { title: "Trust", links: [["Methodology", "/about#methodology"], ["Privacy", "/about#privacy"], ["Contact", "/contact"], ["Sitemap", "/sitemap.xml"]] },
];

export default function Footer() {
  const pathname = usePathname() || "";
  if (hidesSiteChrome(pathname)) return null;
  const year = new Date().getFullYear();

  return (
    <footer className="gr-footer">
      <div className="gr-footer__inner">
        <div className="gr-footer__brand">
          <Logo dark size={32} />
          <p className="gr-footer__tag">Public code. Private cringe. Better stories.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="gr-footer__col">
            <h2 className="gr-footer__heading">{col.title}</h2>
            {col.links.map(([label, href]) => (
              <Link key={label} href={href} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="gr-footer__bar">
        <span>© {year} GitRoast</span>
        <span className="gr-footer__share">Share the pain. Not the personal data.</span>
        <span>
          Protected by reCAPTCHA ·{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
          {" · "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms</a>
        </span>
      </div>
    </footer>
  );
}
