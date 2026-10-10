import "./recruiter.css";
import Icon from "@/components/Icon";

export const SIGNALS = [
  { key: "depth", label: "Project depth", tone: "" },
  { key: "collaboration", label: "Collaboration", tone: "mint" },
  { key: "consistency", label: "Consistency", tone: "gold" },
  { key: "documentation", label: "Documentation", tone: "blue" },
];

export const initials = (name = "") => name.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

export function Avatar({ name, size = 44 }) {
  return (
    <span className="rc-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function FitPill({ fit }) {
  if (!fit || fit.score == null) return <span className="gr-pill gr-pill--blue">Insufficient evidence</span>;
  const tone = fit.label === "Strong" ? "mint" : fit.label === "Good" ? "mint" : "gold";
  return <span className={`gr-pill gr-pill--${tone}`}>{fit.label}</span>;
}

export function SignalMeter({ label, signal, tone }) {
  const has = signal && typeof signal.value === "number";
  return (
    <div className="gr-meter">
      <div className="gr-meter__head">
        <span>{label}</span>
        <b>{has ? signal.value : "—"}</b>
      </div>
      <div className="gr-meter__track" role="img" aria-label={has ? `${label} ${signal.value} out of 100` : `${label}: insufficient public evidence`}>
        <div className={`gr-meter__fill${tone ? ` gr-meter__fill--${tone}` : ""}`} style={{ width: has ? `${signal.value}%` : "0%" }} />
      </div>
      {!has && <span className="gr-help rc-insuff">Insufficient public evidence — not penalized.</span>}
    </div>
  );
}

export function BookmarkButton({ saved, onToggle, label }) {
  return (
    <button type="button" className={`rc-bookmark${saved ? " rc-bookmark--on" : ""}`} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${label}`} onClick={onToggle}>
      <Icon name="bookmark" />
    </button>
  );
}

export function StateCard({ tag, title, text, tone = "", children }) {
  return (
    <div className={`gr-state${tone ? ` gr-state--${tone}` : ""}`} role={tone === "error" ? "alert" : "status"}>
      <span className="gr-state__tag">{tag}</span>
      <p className="gr-state__title">{title}</p>
      {text && <p className="gr-help">{text}</p>}
      {children}
    </div>
  );
}

export function PrivacyCards() {
  return (
    <div className="rc-pair">
      <section className="gr-card gr-card--blue">
        <h2 className="rc-card-title"><Icon name="eye" /> Transparent methodology</h2>
        <p className="gr-help">Signals show source, date range, weight and confidence. Sparse public activity is labeled — not penalized by assumption.</p>
        <a className="rc-link" href="/recruiter/methodology">Review methodology →</a>
      </section>
      <section className="gr-card gr-card--mint">
        <h2 className="rc-card-title"><Icon name="shield" /> Privacy boundaries</h2>
        <p className="gr-help">Public work only. No inferred age, gender, ethnicity, health, location or private employment data. Opt-outs are honored.</p>
        <a className="rc-link rc-link--mint" href="/about#privacy">View ethical-use policy →</a>
      </section>
    </div>
  );
}
