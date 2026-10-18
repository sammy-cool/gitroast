"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { hidesSiteChrome } from "@/components/SiteHeader";

// Compact journeys: touch-first bottom navigation (Home / Roast / Saved / Me). ≥44px targets.
export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  if (hidesSiteChrome(pathname)) return null;

  const me = user ? (user.role === "recruiter" ? "/recruiter" : "/dashboard") : "/auth";
  const tabs = [
    { href: "/", label: "Home", icon: "home", on: pathname === "/" },
    { href: "/#roast", label: "Roast", icon: "flame", on: pathname.startsWith("/roast") },
    { href: "/leaderboard", label: "Saved", icon: "bookmark", on: pathname.startsWith("/leaderboard") },
    { href: me, label: "Me", icon: "user", on: pathname.startsWith("/dashboard") || pathname.startsWith("/auth") },
  ];
  return (
    <nav className="gr-tabbar gr-tabbar--public" aria-label="Primary">
      {tabs.map((t) => (
        <Link key={t.label} href={t.href} aria-current={t.on ? "page" : undefined}>
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
