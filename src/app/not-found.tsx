import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist. Browse 2,400+ remote frontend developer jobs on FrontendEngineers.com.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-7xl font-extrabold text-gray-900 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">This page doesn&apos;t exist</h2>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        But 2,400+ remote frontend jobs do. Go find your next role.
      </p>

      <Link
        href="/"
        className="px-8 py-3.5 bg-[#2563eb] text-white font-bold rounded-full hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-blue-500/20"
      >
        Browse 2,400+ Remote Jobs
      </Link>
    </div>
  );
}
