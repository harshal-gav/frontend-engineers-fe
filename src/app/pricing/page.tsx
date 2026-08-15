"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }

    setLoading(true);
    
    // Replace with your actual LemonSqueezy store name and variant ID
    const STORE_NAME = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE || "your-store";
    const VARIANT_ID = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT || "123456";
    
    // Construct the checkout URL, passing the Firebase UID as custom data
    // This custom data is sent back in the webhook so we know who paid
    const checkoutUrl = `https://${STORE_NAME}.lemonsqueezy.com/checkout/buy/${VARIANT_ID}?checkout[custom][user_id]=${user.uid}`;
    
    window.location.assign(checkoutUrl);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Unlock the Best <span className="text-[#00ffcc]">Remote Frontend</span> Jobs
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Stop sifting through irrelevant listings. Get curated React, Vue, and Angular jobs sent straight to you.
        </p>

        <div className="glass-card max-w-md mx-auto p-8 border border-[#333] bg-[#111] rounded-2xl">
          <div className="text-[#00ffcc] font-semibold tracking-wider uppercase mb-2">Pro Membership</div>
          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="text-5xl font-bold">$9</span>
            <span className="text-gray-400 mb-1">/month</span>
          </div>

          <ul className="text-left space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ffcc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Unlimited access to all jobs</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ffcc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Direct apply links to company ATS</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ffcc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Daily job alerts</span>
            </li>
          </ul>

          <button 
            onClick={handleSubscribe} 
            disabled={loading}
            className="w-full btn-primary py-3 rounded text-black bg-[#00ffcc] font-bold text-lg disabled:opacity-50"
          >
            {loading ? "Redirecting to checkout..." : "Subscribe with LemonSqueezy"}
          </button>
        </div>
      </div>
    </div>
  );
}
