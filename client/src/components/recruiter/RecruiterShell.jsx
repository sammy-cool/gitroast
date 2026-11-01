"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/utils/toast";
import { resendVerification } from "@/services/recruiterService";
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
  { href: "/recruiter/account", label: "Account", icon: "user" },
];

// Pages that stay reachable before the email is verified.
const OPEN_BEFORE_VERIFY = ["/recruiter/account", "/recruiter/methodology"];

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

  const needsVerify = user.emailVerified === false && !OPEN_BEFORE_VERIFY.some((p) => pathname.startsWith(p));

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
      <main className="gr-main">{needsVerify ? <VerifyGate email={user.email} getToken={getToken} /> : children}</main>
      <nav className="gr-tabbar" aria-label="Recruiter tabs">
        {NAV.filter((n) => !["/recruiter/compare", "/recruiter/methodology"].includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n) ? "page" : undefined}>
            <Icon name={n.icon} size={22} />
            {n.label.replace(" talent", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function VerifyGate({ email, getToken }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setBusy(true);
    try {
      await resendVerification(getToken());
      setSent(true);
      toast.success("Verification email sent", { description: `Check ${email}. The link works once.` });
    } catch (err) {
      toast.warning(err.status === 429 ? "Please wait a moment" : "Could not send the email", { description: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gr-state rc-gate" role="status">
      <span className="gr-state__tag">One step left</span>
      <h1 className="gr-h2">Verify your email to open the workspace.</h1>
      <p className="gr-help">We sent a link to <b>{email}</b>. It expires in 24 hours. Talent search, shortlists and comparisons unlock as soon as you confirm.</p>
      <div className="rc-head__actions">
        <button type="button" className="gr-btn gr-btn--primary" onClick={resend} disabled={busy || sent}>{sent ? "Email sent" : busy ? "Sending…" : "Resend email"}</button>
        <a href="/recruiter" className="gr-btn gr-btn--outline">I verified, refresh</a>
      </div>
    </div>
  );
}
