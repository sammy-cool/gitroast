"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export const PRIMARY_NAV = [
  { href: "/", label: "Roast" },
  { href: "/leaderboard", label: "Wall of Shame" },
  { href: "/battle", label: "Battles" },
  { href: "/universe", label: "Universe" },
  { href: "/pricing", label: "Pricing" },
];

// Screens that bring their own chrome (sidebar shells, split-screen auth, 3D universe).
export function hidesSiteChrome(pathname = "") {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/auth") ||
    (pathname.startsWith("/universe/") && pathname !== "/universe")
  );
}

export default function SiteHeader() {
  const pathname = usePathname() || "";
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (hidesSiteChrome(pathname)) return null;

  const isActive = (href) => (href === "/" ? pathname === "/" || pathname.startsWith("/roast") || pathname.startsWith("/repo") : pathname === href || pathname.startsWith(`${href}/`));
  const home = user?.role === "recruiter" ? "/recruiter" : "/dashboard";
  const cta = user
    ? { href: home, label: user.role === "recruiter" ? "Workspace" : "Dashboard" }
    : { href: "/auth", label: "Sign in" };

  return (
    <header className="gr-header">
      <div className="gr-header__inner">
        <Logo />
        <nav className="gr-header__nav" aria-label="Main navigation">
          {PRIMARY_NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className="gr-header__link">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="gr-header__right">
          {!loading && (
            <Link href={cta.href} className="gr-btn gr-btn--outline gr-header__cta">
              {cta.label}
            </Link>
          )}
          <button type="button" className="gr-header__menu" aria-expanded={open} aria-controls="gr-mobile-nav" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="gr-mobile-nav" className="gr-header__sheet" aria-label="Mobile navigation">
          {PRIMARY_NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={cta.href} onClick={() => setOpen(false)} className="gr-btn gr-btn--primary">
            {cta.label}
          </Link>
        </nav>
      )}
    </header>
  );
}
