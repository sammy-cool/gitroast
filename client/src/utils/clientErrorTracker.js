// ============================================================
// GITROAST — Frontend Universal Error Tracker
// ============================================================
// WHAT: Catches ALL unhandled frontend errors:
//       1. Synchronous JS errors (window.onerror)
//       2. Unhandled promise rejections (window.onunhandledrejection)
//       3. React rendering errors (via error.jsx boundary)
//
// WHY:  Frontend silent errors include:
//       - fetch() with no .catch() → rejected promise nobody knows about
//       - Component crashes caught by React error boundary → invisible to dev
//       - JSON.parse(bad data) in a useEffect → silent undefined behaviour
//
//       With this tracker:
//       - Every error logged with context (component, message, stack)
//       - Structured format — easy to grep in browser console
//       - Ready to forward to a backend logging endpoint in the future
//
// WHERE: Called ONCE in client/src/app/layout.jsx:
//        <GlobalErrorTracker /> inside <body>
//
// USAGE: In browser console:
//        All errors show as [GitRoast Error] blocks — easy to find
// ============================================================

"use client";

import { useEffect } from "react";

// ── Log formatter ─────────────────────────────────────────────
// WHAT: Formats error info for browser console
// WHY group/groupEnd: collapses by default — doesn't flood the console
//     expandable when you need to investigate
function logToConsole(type, message, meta = {}) {
  const ts = new Date().toISOString();

  console.group(
    `%c[GitRoast Error] ${type}`,
    "color: #FF3D3D; font-weight: bold;",
  );
  console.error("Message:", message);
  console.error("Time:   ", ts);

  if (meta.source) console.error("Source: ", meta.source);
  if (meta.line) console.error("Line:   ", meta.line, "Col:", meta.col);
  if (meta.stack) console.error("Stack:  ", meta.stack);

  console.groupEnd();
}

// ── React component ───────────────────────────────────────────
// WHAT: Attaches window-level error handlers when component mounts
// WHY useEffect: window is only available in browser — not during SSR
// WHERE: Rendered once in layout.jsx — applies globally across all pages
export default function GlobalErrorTracker() {
  useEffect(() => {
    // ── Handler 1: Synchronous JS errors ────────────────────
    // WHAT: Fires on any uncaught synchronous error anywhere in the app
    // WHY: Without this, errors like "Cannot read property of undefined"
    //      silently break features with no console trace
    const prevOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      logToConsole("Uncaught Exception", message, {
        source,
        line: lineno,
        col: colno,
        stack: error?.stack,
      });
      // WHY: call previous handler if it existed (doesn't replace others)
      if (prevOnError) prevOnError(message, source, lineno, colno, error);
      // WHY false: don't suppress browser default behaviour
      return false;
    };

    // ── Handler 2: Unhandled Promise rejections ──────────────
    // WHAT: Fires when a Promise rejects and nobody catches it
    // WHY: The most common silent error in React apps
    //      Example: useEffect(() => { fetch(url) }, []) — no .catch()
    //               if fetch fails → rejected promise → silent failure
    const handleRejection = (event) => {
      const reason = event.reason;
      logToConsole(
        "Unhandled Promise Rejection",
        reason?.message || String(reason),
        {
          stack: reason?.stack,
        },
      );
      // WHY: don't call event.preventDefault() — let browser also log it
    };
    window.addEventListener("unhandledrejection", handleRejection);

    // ── Cleanup on unmount ────────────────────────────────────
    // WHY: HydrationWrapper + React StrictMode may re-mount components
    //      cleanup prevents duplicate handlers
    return () => {
      window.onerror = prevOnError || null;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // WHY null: this component is purely side-effects — renders nothing
  return null;
}
