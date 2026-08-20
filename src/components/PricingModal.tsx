"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

export default function PricingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    intent: "subscription",
    vault: true,
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
            and advanced filters.
          </p>
        </div>

        <ul className="space-y-3 mb-8 text-sm">
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Unlimited access to all premium remote jobs
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Direct apply links to company ATS
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#00ffcc] flex-shrink-0">✓</span>
            Advanced job filtering
          </li>
        </ul>

        <div className="min-h-[150px]">
          {error && <div className="text-red-500 text-sm mb-3 text-center">{error}</div>}

          {!user ? (
            <button
              onClick={() => {
                onClose();
                router.push("/auth/signup");
              }}
              className="w-full btn-primary py-3.5 rounded-xl text-black bg-[#00ffcc] font-bold text-base"
            >
              Create Account to Subscribe
            </button>
          ) : (
            <PayPalScriptProvider options={initialOptions}>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", color: "gold" }}
                createSubscription={(data, actions) => {
                  return actions.subscription.create({
                    plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
                    custom_id: user.uid,
                  });
                }}
                onApprove={async (data, actions) => {
                  alert("🎉 Subscription created! Your account will be upgraded momentarily.");
                  onClose();
                  router.push("/");
                }}
                onError={(err) => {
                  console.error("PayPal Modal Error:", err);
                  setError("Payment failed. Please try another method.");
                }}
              />
            </PayPalScriptProvider>
          )}

          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white py-3 transition-colors text-sm mt-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
