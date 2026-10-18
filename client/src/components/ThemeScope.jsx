"use client";

import { usePathname } from "next/navigation";

// Screens already on the "Sunlit editorial arcade" system. Anything else renders inside
// the legacy dark scope (old tokens restored) until it is migrated — then add it here.
const MIGRATED = ["/", "/roast", "/leaderboard", "/pricing", "/dashboard", "/auth", "/recruiter", "/repo", "/battle", "/history", "/contact", "/about", "/offline", "/universe"];

const MIGRATED_EXACT = [];

export function isMigrated(pathname = "") {
  if (MIGRATED_EXACT.includes(pathname)) return true;
  return MIGRATED.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}

export default function ThemeScope({ children }) {
  const pathname = usePathname() || "/";
  return <div className={isMigrated(pathname) ? "gr-scope" : "gr-scope gr-legacy-dark"}>{children}</div>;
}
