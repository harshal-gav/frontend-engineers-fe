import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remote Frontend Referrals | Get Referred by Real Engineers",
  description:
    "Browse referrals for remote frontend developer jobs posted by real engineers. Pro members get access to referral links and direct contacts. Post your referral for free.",
  alternates: {
    canonical: "/referrals",
  },
};

export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
