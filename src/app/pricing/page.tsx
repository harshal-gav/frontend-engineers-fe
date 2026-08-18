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

    try {
      // Step 1: Create order on backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 90000, // ₹900 = $9 equivalent (in paise)
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
          // Step 3: Verify payment on backend
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
              router.push("/");
            } else {
              const err = await verifyRes.json();
              alert(`Payment verification failed: ${err.error}`);
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
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
      <div className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Unlock the Best{" "}
            <span className="text-[#00ffcc]">Remote Frontend</span> Jobs
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Stop sifting through irrelevant listings. Get curated React, Vue,
            and Angular jobs sent straight to you.
          </p>

          <div className="glass-card max-w-md mx-auto p-8 border border-[#333] bg-[#111] rounded-2xl">
            <div className="text-[#00ffcc] font-semibold tracking-wider uppercase mb-2">
              Pro Membership
            </div>
            <div className="flex items-end justify-center gap-1 mb-6">
              <span className="text-5xl font-bold">₹900</span>
              <span className="text-gray-400 mb-1">/month</span>
            </div>

            <ul className="text-left space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#00ffcc]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span>Unlimited access to all jobs</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#00ffcc]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span>Direct apply links to company ATS</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#00ffcc]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span>Daily job alerts</span>
              </li>
            </ul>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full btn-primary py-3 rounded text-black bg-[#00ffcc] font-bold text-lg disabled:opacity-50"
              >
                {loading ? "Processing..." : "Subscribe Now"}
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-gray-400 hover:text-white py-3 transition-colors underline"
              >
                Continue to portal (Free Preview)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
