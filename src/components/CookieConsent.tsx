"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only run on client
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie_consent", "all");
    setShowBanner(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem("cookie_consent", "essential_only");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-[#111227] border border-[#1a1a2e] shadow-2xl rounded-xl p-5 md:p-6 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">We value your privacy</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
            Read our <Link href="/legal/privacy-policy" className="text-[#00ffcc] hover:underline">Privacy Policy</Link> for more information.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button 
            onClick={handleRejectNonEssential}
            className="px-5 py-2.5 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a2e] hover:text-white transition-colors text-sm font-medium"
          >
            Reject Non-Essential
          </button>
          <button 
            onClick={handleAcceptAll}
            className="px-5 py-2.5 rounded-lg bg-[#00ffcc] text-black hover:bg-[#00e6b8] transition-colors text-sm font-bold"
          >
            Accept All
          </button>
        </div>

      </div>
    </div>
  );
}
