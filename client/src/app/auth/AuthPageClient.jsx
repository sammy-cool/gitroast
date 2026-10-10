"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { toast, notify } from "@/utils/toast";
import { recruiterSignup, recruiterLogin, recruiterGoogle } from "@/services/recruiterService";
import "./auth.css";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function GoogleButton({ onCredential, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return undefined;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential(r.credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: ref.current.offsetWidth || 360 });
    };
    if (window.google?.accounts?.id) init();
    else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }
    return () => { cancelled = true; };
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" className="gr-btn gr-btn--outline gr-btn--block" disabled title="Google sign-in is not configured for this environment">
        Continue with Google
      </button>
    );
  }
  return <div ref={ref} className="auth-google" aria-disabled={disabled} />;
}

export default function AuthPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, loginWithGitHub, loginWithToken } = useAuth();
  const [role, setRole] = useState(params.get("role") === "recruiter" ? "recruiter" : "developer");
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace(user.role === "recruiter" ? "/recruiter" : "/dashboard");
  }, [loading, user, router]);

  async function finish(session) {
    loginWithToken(session.token);
    notify.signedIn();
    router.push("/recruiter");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !consent) return setError("Please agree to use public developer evidence responsibly.");
    setBusy(true);
    try {
      const session = mode === "signup"
        ? await recruiterSignup({ email, password, acceptResponsibleUse: consent })
        : await recruiterLogin({ email, password });
      await finish(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(credential) {
    if (mode === "signup" && !consent) return setError("Please agree to use public developer evidence responsibly.");
    setBusy(true);
    try {
      await finish(await recruiterGoogle({ credential, acceptResponsibleUse: consent }));
    } catch (err) {
      toast.error("Google sign-in failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  }

  const recruiter = role === "recruiter";

  return (
    <main className="auth">
      <aside className="auth__panel">
        <div className="auth__panel-top">
          <Logo dark />
          {recruiter && <span className="gr-pill gr-pill--ember">Recruiter preview</span>}
        </div>
        <div className="auth__panel-copy">
          <p className="auth__eyebrow">A clearer way into GitRoast</p>
          <h1 className="auth__headline">{recruiter ? "Find the work behind the profile." : "Your GitHub has a story."}</h1>
          <p className="auth__lede">
            {recruiter
              ? "Explore explainable public evidence for role fit — project depth, consistency and collaboration — without treating a roast like a hiring score."
              : "Roast profiles, track your history and earn badges. Public code in, useful satire out."}
          </p>
          <ul className="auth__points">
            <li><b>Evidence, not vibes</b><span>Every signal links to a public source and time window.</span></li>
            <li><b>Professional context stays separate</b><span>Playful roast copy never appears in talent evaluation.</span></li>
            <li><b>Privacy boundaries built in</b><span>Opt-outs, public-only data and ethical-use guidance stay visible.</span></li>
          </ul>
        </div>
      </aside>

      <section className="auth__main">
        <div className="auth__inner">
          <p className="gr-eyebrow">Choose your path</p>
          <h2 className="gr-h2">How will you use GitRoast?</h2>

          <div className="auth__roles" role="radiogroup" aria-label="How will you use GitRoast?">
            <div className={`auth-role${!recruiter ? " auth-role--on" : ""}`}>
              <button type="button" role="radio" aria-checked={!recruiter} className="auth-role__pick" onClick={() => setRole("developer")}>
                <span className="gr-mono auth-role__icon" aria-hidden="true">&lt;/&gt;</span>
                <b>I&apos;m a developer</b>
                <span>Roast profiles, track history and earn badges.</span>
                {!recruiter && <span className="gr-pill gr-pill--ember auth-role__sel">Selected</span>}
              </button>
              <button type="button" className="gr-btn gr-btn--outline gr-btn--block" onClick={loginWithGitHub}>Continue with GitHub</button>
            </div>
            <div className={`auth-role${recruiter ? " auth-role--on" : ""}`}>
              <button type="button" role="radio" aria-checked={recruiter} className="auth-role__pick" onClick={() => setRole("recruiter")}>
                <span className="auth-role__icon" aria-hidden="true">▣</span>
                <b>I&apos;m a recruiter</b>
                <span>Search public evidence, save talent and build shortlists.</span>
                {recruiter && <span className="gr-pill gr-pill--ember auth-role__sel">Selected</span>}
              </button>
              <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={() => setRole("recruiter")}>Continue as recruiter</button>
            </div>
          </div>

          <hr className="auth__rule" />

          {recruiter ? (
            <form onSubmit={submit} noValidate className="auth__form">
              <h3 className="auth__form-title">{mode === "signup" ? "Create your recruiter workspace" : "Sign in to your workspace"}</h3>
              <p className="gr-help">No GitHub account required.</p>
              <GoogleButton onCredential={onGoogle} disabled={busy} />
              <div className="auth__or"><span>or professional email</span></div>

              <label className="gr-label" htmlFor="auth-email">Work email</label>
              <input id="auth-email" className="gr-input" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label className="gr-label" htmlFor="auth-password">Password</label>
              <input id="auth-password" className="gr-input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={10} placeholder="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />

              {mode === "signup" && (
                <label className="auth__consent">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>I agree to use public developer evidence responsibly and not infer sensitive personal attributes.</span>
                </label>
              )}
              {error && <p className="gr-error" role="alert">{error}</p>}

              <button type="submit" className="gr-btn gr-btn--primary gr-btn--block" disabled={busy}>
                {busy ? "Working…" : mode === "signup" ? "Create recruiter workspace" : "Sign in"}
              </button>
              <p className="gr-help">
                {mode === "signup" ? "Already have an account? " : "New here? "}
                <button type="button" className="auth__link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>
                  {mode === "signup" ? "Sign in" : "Create a workspace"}
                </button>
              </p>
              <ul className="auth__trust">
                <li>Public evidence only</li>
                <li>Encrypted sign-in</li>
                <li>Human review expected</li>
              </ul>
            </form>
          ) : (
            <div className="auth__form">
              <h3 className="auth__form-title">Sign in with GitHub</h3>
              <p className="gr-help">We only request what is needed to show your dashboard. Public data only.</p>
              <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={loginWithGitHub}>Continue with GitHub</button>
              <p className="gr-help">Just browsing? <Link href="/" className="auth__link">Roast a profile without signing in</Link>.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
