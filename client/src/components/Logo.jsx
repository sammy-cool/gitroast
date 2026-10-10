import Link from "next/link";

export function FlameMark({ size = 36 }) {
  return (
    <span className="gr-logo__mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-1.7.8-3 1.7-4 .2 1.2.9 2 1.8 2.2C10.2 8.2 10.5 5.6 12 3z" />
      </svg>
    </span>
  );
}

export default function Logo({ href = "/", dark = false, size = 36 }) {
  return (
    <Link href={href} className={`gr-logo${dark ? " gr-logo--dark" : ""}`} aria-label="GitRoast home">
      <FlameMark size={size} />
      <span className="gr-logo__word">GitRoast</span>
    </Link>
  );
}
