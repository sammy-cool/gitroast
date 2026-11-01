"use client";

import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential, disabled }) {
  const ref = useRef(null);
  // Always call the latest handler without re-initialising Google's button on every render.
  const handlerRef = useRef(onCredential);
  useEffect(() => {
    handlerRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return undefined;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => handlerRef.current?.(r.credential) });
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
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" className="gr-btn gr-btn--outline gr-btn--block" disabled title="Google sign-in is not configured for this environment">
        Continue with Google
      </button>
    );
  }
  return <div ref={ref} className="auth-google" aria-disabled={disabled} />;
}
