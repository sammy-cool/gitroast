// ============================================================
// GITROAST — Centralized Components Barrel
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Centralized export registry organizing client UI components into domain features:
// • Roast: RoastCard, RoastReactions, CommitShame, StatsGrid, RepoRoastCard, AnalyzingScreen
// • Battle: BattleCard
// • Leaderboard: LeaderboardTable, CompanyLeaderboardTable, Pagination
// • History: HistoryCard, ScoreChart, MonthlyComparison
// • Pro: ProModal, ProBadge, PaymentFlow, PaymentModal, PricingCard
// • Share: ShareButtons, RoastCertificate, GitHubWrapped
// • UI: Footer, Breadcrumb, RateLimitBanner, LiveRoastFeed, GitHubLoginBtn, UsernameInput
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Feature Discoverability: Developers can instantly locate all components belonging to a feature.
// 2. Backward Compatibility: Direct imports (`@/components/RoastCard`) and barrel imports
//    (`import { RoastCard } from '@/components'`) both work seamlessly.
// 3. Tree-Shaking: Next.js Turbopack compiler tree-shakes unused components automatically.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • When importing multiple related UI components within pages or feature containers.
// • Simplifies import statements (e.g. `import { RoastCard, RoastReactions } from '@/components'`).
//
// ── USE CASES: ───────────────────────────────────────────────
// • Feature composition pages importing several domain components together.
// • Clean imports across client components without deep relative paths.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use inside dynamically imported components that require `next/dynamic` code splitting,
//   as dynamic imports should reference direct component files to prevent bundling siblings.
// ============================================================

// ── Roast Feature ─────────────────────────────────────────────
export { default as RoastCard } from "./RoastCard";
export { default as RoastReactions } from "./RoastReactions";
export { default as CommitShame } from "./CommitShame";
export { default as StatsGrid } from "./StatsGrid";
export { default as RepoRoastCard } from "./RepoRoastCard";
export { default as AnalyzingScreen } from "./AnalyzingScreen";

// ── Battle Feature ────────────────────────────────────────────
export { default as BattleCard } from "./BattleCard";

// ── Leaderboard Feature ───────────────────────────────────────
export { default as LeaderboardTable } from "./LeaderboardTable";
export { default as CompanyLeaderboardTable } from "./CompanyLeaderboardTable";
export { default as Pagination } from "./Pagination";

// ── History Feature ───────────────────────────────────────────
export { default as HistoryCard } from "./HistoryCard";
export { default as ScoreChart } from "./ScoreChart";
export { default as MonthlyComparison } from "./MonthlyComparison";

// ── Pro & Payments Feature ────────────────────────────────────
export { default as ProModal } from "./ProModal";
export { default as ProBadge } from "./ProBadge";
export { default as PaymentFlow } from "./PaymentFlow";
export { default as PaymentModal } from "./PaymentModal";
export { default as PricingCard } from "./PricingCard";

// ── Share & Certificates Feature ──────────────────────────────
export { default as ShareButtons } from "./ShareButtons";
export { default as RoastCertificate } from "./RoastCertificate";
export { default as GitHubWrapped } from "./GitHubWrapped";

// ── Common UI Feature ─────────────────────────────────────────
export { default as Footer } from "./Footer";
export { default as Breadcrumb } from "./Breadcrumb";
export { default as RateLimitBanner } from "./RateLimitBanner";
export { default as LiveRoastFeed } from "./LiveRoastFeed";
export { default as GitHubLoginBtn } from "./GitHubLoginBtn";
export { default as UsernameInput } from "./UsernameInput";
export { default as HydrationWrapper } from "./HydrationWrapper";
export { default as ToastConfig } from "./ToastConfig";
