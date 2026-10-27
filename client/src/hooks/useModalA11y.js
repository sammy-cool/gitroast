"use client";

import { useEffect, useRef } from "react";

// Nested dialogs (plans → checkout): only the top-most one reacts to Escape/Tab.
const stack = [];

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/**
 * Dialog behaviour for custom modals: Escape closes, focus moves into the dialog, Tab stays inside,
 * focus returns to the opener on close, and the page behind does not scroll.
 * `ref` must point at the element carrying role="dialog".
 */
export default function useModalA11y(ref, onClose, active = true) {
  // Keep the latest onClose without re-running the effect (parents often pass inline arrows).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    const token = Symbol("modal");
    stack.push(token);
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (node) {
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
      const first = node.querySelector(FOCUSABLE);
      (first || node).focus({ preventScroll: true });
    }

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const at = stack.indexOf(token);
      if (at >= 0) stack.splice(at, 1);
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
