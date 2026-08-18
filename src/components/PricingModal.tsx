"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

    try {
      // Step 1: Create order on backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 90000, // ₹900 in paise
          currency: "INR",
          receipt: `pro_${user.uid}_${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      const { order_id, amount, currency } = await res.json();

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "FrontendEngineers.com",
        description: "Pro Membership — Monthly",
        order_id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                user_id: user.uid,
              }),
            });

            if (verifyRes.ok) {
              alert("🎉 Payment successful! You are now a Pro member.");
              onClose();
              router.push("/");
            } else {
              const err = await verifyRes.json();
              alert(`Payment verification failed: ${err.error}`);
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
          setLoading(false);
        },
        prefill: {
          email: user.email || "",
          name: user.displayName || "",
        },
        theme: {
          color: "#00ffcc",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response: any) => {
        alert(
          `Payment failed: ${response.error.description || "Unknown error"}`
        );
        setLoading(false);
      });

      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Error: ${message}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
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
              <span className="text-4xl sm:text-5xl font-bold">₹900</span>
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
            {loading ? "Processing..." : "Subscribe Now"}
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white py-3 transition-colors text-sm mt-2 min-h-[44px]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
