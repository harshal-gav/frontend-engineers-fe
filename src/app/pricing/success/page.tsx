"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center py-20 px-4">
      <div className="text-center glass-card p-12 max-w-lg border border-[#2563eb]/30 bg-[#2563eb]/5 rounded-2xl">
        <div className="w-16 h-16 mx-auto bg-[#2563eb] text-white rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-500 mb-8">
          Welcome to FrontendEngineers Pro. You now have unlimited access to all remote frontend and JavaScript jobs.
        </p>
        <Link href="/" className="btn-primary py-3 px-8 rounded text-white bg-[#2563eb] font-bold text-lg inline-block">
          View All Jobs
        </Link>
      </div>
    </div>
  );
}
