import RecruiterShell from "@/components/recruiter/RecruiterShell";

export const metadata = {
  title: "Recruiter workspace — GitRoast",
  robots: { index: false, follow: false },
};

export default function RecruiterLayout({ children }) {
  return <RecruiterShell>{children}</RecruiterShell>;
}
