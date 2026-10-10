import { Suspense } from "react";
import AuthPageClient from "./AuthPageClient";

export const metadata = {
  title: "Sign in — GitRoast",
  description: "Choose how you use GitRoast: roast profiles as a developer, or search public evidence as a recruiter.",
  robots: { index: false, follow: true },
};

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient />
    </Suspense>
  );
}
