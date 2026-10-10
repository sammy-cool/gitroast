"use client";

import { useState, useCallback } from "react";
import { toast, toastPromise, notify } from "@/utils/toast";
import { trackShare } from "@/services/roastService";

const origin = () => (typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev");

export function badgeMarkdown(username, style = "card") {
  const q = style === "shield" ? "?style=shield" : "";
  return `[![GitRoast Score](${origin()}/api/badge/${username}${q})](${origin()}/history/${username})`;
}

/** Share / copy / download behaviour for a roast result (logic moved out of ShareButtons). */
export default function useRoastShare({ username, roastId, roastText, isPro, onProClick }) {
  const [downloading, setDownloading] = useState(false);

  const shareLink = useCallback(() => {
    const url = `${origin()}/history/${username}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        trackShare(roastId);
        notify.copied({ what: "Roast link" });
      })
      .catch(() => toast.error("Could not copy the link", { description: "Copy it from the address bar instead." }));
  }, [username, roastId]);

  const copyText = useCallback(() => {
    if (!roastText) return;
    navigator.clipboard
      .writeText(`"${roastText}" — Roasted by GitRoast`)
      .then(() => notify.copied({ what: "Roast text" }))
      .catch(() => toast.error("Could not copy the text"));
  }, [roastText]);

  const shareX = useCallback(() => {
    const url = `${origin()}/history/${username}`;
    const snippet = roastText ? `"${roastText.slice(0, 120)}${roastText.length > 120 ? "..." : ""}"` : "I just got my GitHub roasted.";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${snippet}\n\nCheck my roast at ${url} #GitRoast #GitHub`)}`, "_blank", "noopener,noreferrer");
    trackShare(roastId);
  }, [username, roastText, roastId]);

  const copyBadge = useCallback(
    (style = "card") => {
      navigator.clipboard
        .writeText(badgeMarkdown(username, style))
        .then(() => {
          trackShare(roastId);
          notify.copied({ what: "README badge Markdown" });
        })
        .catch(() => toast.error("Could not copy the badge code"));
    },
    [username, roastId],
  );

  const download = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await toastPromise(
        (async () => {
          const html2canvas = (await import("html2canvas")).default;
          const element = document.getElementById("roast-card-capture");
          if (!element) throw new Error("Card element not found");
          const canvas = await html2canvas(element, {
            scale: isPro ? 2 : 1,
            useCORS: true,
            backgroundColor: "#171711",
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
          });
          if (!isPro) {
            const ctx = canvas.getContext("2d");
            ctx.save();
            ctx.globalAlpha = 0.16;
            ctx.fillStyle = "#E84E2A";
            ctx.font = 'bold 38px "IBM Plex Mono", monospace';
            ctx.textAlign = "center";
            for (let y = -100; y < canvas.height + 100; y += 180) {
              for (let x = -100; x < canvas.width + 100; x += 260) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-Math.PI / 6);
                ctx.fillText("ROASTED BY GITROAST", 0, 0);
                ctx.restore();
              }
            }
            ctx.restore();
          }
          const link = document.createElement("a");
          link.download = `gitroast-${username}.png`;
          link.href = canvas.toDataURL("image/png", 1.0);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })(),
        {
          loading: "Rendering roast card…",
          success: isPro ? "HD card downloaded" : "Card downloaded",
          error: "Download failed. Please try again.",
        },
      );
      trackShare(roastId);
    } catch {
      /* toastPromise already surfaced the error */
    } finally {
      setDownloading(false);
    }
  }, [downloading, isPro, username, roastId]);

  const proNudge = useCallback(() => notify.keepHistory({ onAction: onProClick }), [onProClick]);

  return { shareLink, copyText, shareX, copyBadge, download, downloading, proNudge };
}
