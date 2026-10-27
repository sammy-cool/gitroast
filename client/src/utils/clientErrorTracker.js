"use client";

import { useEffect } from "react";

function logToConsole(type, message, meta = {}) {
  const ts = new Date().toISOString();

  console.group(
    `%c[GitRoast Error] ${type}`,
    "color: #B3261E; font-weight: bold;",
  );
  console.error("Message:", message);
  console.error("Time:   ", ts);

  if (meta.source) console.error("Source: ", meta.source);
  if (meta.line) console.error("Line:   ", meta.line, "Col:", meta.col);
  if (meta.stack) console.error("Stack:  ", meta.stack);

  console.groupEnd();
}

export default function GlobalErrorTracker() {
  useEffect(() => {
    const prevOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      logToConsole("Uncaught Exception", message, {
        source,
        line: lineno,
        col: colno,
        stack: error?.stack,
      });
      if (prevOnError) prevOnError(message, source, lineno, colno, error);
      return false;
    };

    const handleRejection = (event) => {
      const reason = event.reason;
      logToConsole(
        "Unhandled Promise Rejection",
        reason?.message || String(reason),
        {
          stack: reason?.stack,
        },
      );
    };
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.onerror = prevOnError || null;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}

