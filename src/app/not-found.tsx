import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Browse remote frontend developer jobs on FrontendEngineers.com.",
  robots: { index: false, follow: true },
};



export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. 
        Try browsing our latest remote frontend developer jobs instead.
      </p>

      <Link
        href="/"
        className="px-8 py-3.5 bg-[#2563eb] text-white font-bold rounded-full hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-blue-500/20 mb-10"
      >
        Browse All Remote Jobs
      </Link>



      <div className="mt-10 flex gap-6 text-sm text-gray-500">
        <Link href="/about" className="hover:text-[#2563eb] transition-colors">About Us</Link>
        <Link href="/employers/pricing" className="hover:text-[#2563eb] transition-colors">Post a Job</Link>
        <Link href="/pricing" className="hover:text-[#2563eb] transition-colors">Pro Membership</Link>
      </div>
    </div>
  );
}
