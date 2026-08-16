"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PricingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth/signup");
      onClose();
      return;
    }

    setLoading(true);

    // Construct the LemonSqueezy checkout URL, passing the Firebase UID
    // as custom data so the webhook can map the payment to the correct user
    const STORE_NAME =
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE || "your-store";
    const VARIANT_ID =
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT || "123456";

    const checkoutUrl = `https://${STORE_NAME}.lemonsqueezy.com/checkout/buy/${VARIANT_ID}?checkout[custom][user_id]=${user.uid}`;

    window.location.assign(checkoutUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card p-6 sm:p-8 rounded-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors rounded-full hover:bg-[var(--bg-hover)]"
          aria-label="Close pricing modal"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="text-[#00ffcc] font-semibold tracking-wider uppercase text-sm mb-3">
            Pro Membership
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Unlock Full Access
          </h2>
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold">$9</span>
            <span className="text-gray-400 mb-1">/month</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
            Get instant access to apply links, full job descriptions,
            advanced filters, and real-time alerts.
          </p>
        </div>

        <ul className="space-y-3 mb-8 text-sm">
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Unlimited access to all jobs
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Direct apply links to company ATS
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Company names &amp; salary data
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Daily job alerts via email
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Saved searches &amp; filters
          </li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full btn-primary py-3.5 rounded-xl text-white font-bold text-base disabled:opacity-50 min-h-[48px]"
        >
          {loading
            ? "Redirecting to checkout..."
            : "Subscribe with LemonSqueezy"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-gray-400 hover:text-white py-3 transition-colors text-sm mt-2 min-h-[44px]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
