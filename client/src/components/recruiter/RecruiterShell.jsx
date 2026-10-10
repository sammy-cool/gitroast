"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import "./recruiter.css";

const NAV = [
  { href: "/recruiter", label: "Talent", icon: "users", exact: true },
  { href: "/recruiter/saved", label: "Saved talent", icon: "bookmark" },
  { href: "/recruiter/shortlists", label: "Shortlists", icon: "list" },
  { href: "/recruiter/compare", label: "Compare", icon: "columns" },
  { href: "/recruiter/methodology", label: "Methodology", icon: "book" },
];

export default function RecruiterShell({ children }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, loading, logout, getToken } = useAuth();
  const waiting = loading || (!user && Boolean(getToken()));

  useEffect(() => {
    if (!waiting && (!user || user.role !== "recruiter")) router.replace("/auth?role=recruiter");
  }, [waiting, user, router]);

  if (waiting || !user || user.role !== "recruiter") {
    return <div className="rc-loading" role="status">Opening your workspace…</div>;
  }

  const active = (item) => (item.exact ? pathname === item.href || pathname.startsWith("/recruiter/talent") : pathname.startsWith(item.href));

  return (
    <div className="gr-shell">
      <aside className="gr-side" aria-label="Recruiter navigation">
        <Logo dark />
        <nav className="rc-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="gr-side__link" aria-current={active(n) ? "page" : undefined}>
              <Icon name={n.icon} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="rc-side-foot">
          <p className="rc-org">{user.organization || user.email}</p>
          <button type="button" className="gr-side__link rc-logout" onClick={async () => { await logout(); router.push("/"); }}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>
      <main className="gr-main">{children}</main>
      <nav className="gr-tabbar" aria-label="Recruiter tabs">
        {NAV.slice(0, 4).map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n) ? "page" : undefined}>
            <Icon name={n.icon} size={22} />
            {n.label.replace(" talent", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
