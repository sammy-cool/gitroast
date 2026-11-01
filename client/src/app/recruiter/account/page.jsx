"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/utils/toast";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { resendVerification, deleteRecruiterAccount } from "@/services/recruiterService";

export default function RecruiterAccountPage() {
  const router = useRouter();
  const { user, getToken, logout } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  if (!user) return null;
  const usesGoogle = user.authProvider === "google";

  async function resend() {
    try {
      await resendVerification(getToken());
      setResent(true);
      toast.success("Verification email sent", { description: `Check ${user.email}.` });
    } catch (err) {
      toast.warning(err.status === 429 ? "Please wait a moment" : "Could not send the email", { description: err.message });
    }
  }

  async function remove({ credential } = {}) {
    setError("");
    if (confirm !== "DELETE") return setError("Type DELETE to confirm.");
    if (!usesGoogle && !password) return setError("Enter your password to confirm.");
    setBusy(true);
    try {
      await deleteRecruiterAccount(getToken(), { password, credential });
      toast.success("Account deleted", { description: "Your workspace, saved talent and shortlists were removed." });
      await logout();
      router.replace("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rc-page">
      <p className="gr-eyebrow">Account</p>
      <h1 className="gr-h1 rc-title">Your recruiter account.</h1>

      <section className="gr-card" aria-labelledby="acc-h">
        <h2 id="acc-h" className="rc-card-title">Details</h2>
        <dl className="rc-kv rc-kv--list">
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Organization</dt><dd>{user.organization || "Not set"}</dd></div>
          <div><dt>Sign-in method</dt><dd>{usesGoogle ? "Google" : "Email and password"}</dd></div>
          <div>
            <dt>Email status</dt>
            <dd>{user.emailVerified ? "Verified" : "Not verified"}</dd>
          </div>
        </dl>
        {!user.emailVerified && (
          <button type="button" className="gr-btn gr-btn--primary" onClick={resend} disabled={resent}>{resent ? "Email sent" : "Resend verification email"}</button>
        )}
        {!usesGoogle && <p className="gr-help">Forgot your password? Sign out and use &ldquo;Forgot password?&rdquo; on the sign-in screen.</p>}
      </section>

      <section className="gr-card gr-card--ember" aria-labelledby="del-h">
        <h2 id="del-h" className="rc-card-title">Delete account</h2>
        <p className="gr-help">This permanently removes your recruiter account, saved talent and shortlists. It cannot be undone. Developer profiles and roasts are not affected.</p>
        <label className="gr-label" htmlFor="del-confirm">Type DELETE to confirm</label>
        <input id="del-confirm" className="gr-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} />
        {usesGoogle ? (
          <div style={{ marginTop: 10 }}>
            <p className="gr-help">Confirm with Google to finish:</p>
            <GoogleSignInButton onCredential={(credential) => remove({ credential })} disabled={busy || confirm !== "DELETE"} />
          </div>
        ) : (
          <>
            <label className="gr-label" htmlFor="del-password" style={{ marginTop: 10 }}>Password</label>
            <input id="del-password" className="gr-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="gr-btn gr-btn--dark" style={{ marginTop: 12 }} onClick={() => remove()} disabled={busy}>{busy ? "Deleting…" : "Delete my account"}</button>
          </>
        )}
        {error && <p className="gr-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
