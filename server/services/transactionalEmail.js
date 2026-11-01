/**
 * Transactional email (verification, password reset) through Resend.
 * - Production without RESEND_API_KEY: nothing is sent and the link is NEVER logged.
 * - Development without a key: the link is printed to the console so flows can be tested.
 * Note: with the default sender (onboarding@resend.dev) Resend only delivers to the account owner.
 * Verify a domain in Resend and set EMAIL_FROM to send to real recruiters.
 */
const { logger } = require("../utils/logger");

const RESEND_API_URL = "https://api.resend.com/emails";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Public base URL used inside emails. APP_URL wins; otherwise the first non-local CLIENT_URL entry. */
function appBaseUrl(env = process.env) {
  if (env.APP_URL) return env.APP_URL.replace(/\/+$/, "");
  const list = String(env.CLIENT_URL || "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean);
  const pick = list.find((u) => !/localhost|127\.0\.0\.1/.test(u)) || list[0];
  return pick.replace(/\/+$/, "");
}

function layout(title, bodyHtml, buttonLabel, link) {
  return `<!doctype html><html><body style="margin:0;background:#F3EFE8;padding:24px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#171711">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#FFFDF8;border:1px solid #E3DCCF;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:#B83C1D">GitRoast</p>
<h1 style="margin:0 0 12px;font:400 28px/1.15 Georgia,serif">${esc(title)}</h1>
${bodyHtml}
<p style="margin:20px 0"><a href="${esc(link)}" style="display:inline-block;background:#D14626;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(buttonLabel)}</a></p>
<p style="margin:0 0 6px;font-size:13px;color:#5F5A52">If the button does not work, paste this link into your browser:<br><span style="word-break:break-all">${esc(link)}</span></p>
<p style="margin:14px 0 0;font-size:12px;color:#716C61">Public evidence only. Human review expected.</p>
</td></tr></table></body></html>`;
}

function verificationEmail({ link }) {
  return {
    subject: "Verify your GitRoast recruiter email",
    text: `Verify your email to open your GitRoast recruiter workspace:\n${link}\n\nThis link expires in 24 hours. If you did not create this account, ignore this email.`,
    html: layout("Verify your email", `<p style="margin:0;font-size:15px;color:#5F5A52">Confirm this address to open your recruiter workspace. The link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`, "Verify email", link),
  };
}

function resetEmail({ link }) {
  return {
    subject: "Reset your GitRoast password",
    text: `Reset your GitRoast password:\n${link}\n\nThis link expires in 1 hour and works once. If you did not ask for this, ignore this email; your password stays the same.`,
    html: layout("Reset your password", `<p style="margin:0;font-size:15px;color:#5F5A52">Use the button below to choose a new password. The link expires in 1 hour and works once. If you did not ask for this, ignore this email; your password stays the same.</p>`, "Choose a new password", link),
  };
}

async function sendEmail({ to, subject, text, html }, { env = process.env, fetchImpl = fetch } = {}) {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") {
      logger.warn("Email", "RESEND_API_KEY missing: transactional email not sent", { subject });
    } else {
      // Development only: print so the flow is testable. Never reached in production.
      console.log(`\n[dev email] to=${to}\nsubject=${subject}\n${text}\n`);
    }
    return { delivered: false, reason: "no-provider" };
  }
  try {
    const res = await fetchImpl(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM || "GitRoast <onboarding@resend.dev>", to: [to], subject, text, html }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logger.error("Email", "Resend rejected a transactional email", { status: res.status });
      return { delivered: false, reason: `provider-${res.status}` };
    }
    return { delivered: true };
  } catch (err) {
    logger.error("Email", "Transactional email failed", { message: err.message });
    return { delivered: false, reason: "network" };
  }
}

module.exports = { appBaseUrl, verificationEmail, resetEmail, sendEmail };
