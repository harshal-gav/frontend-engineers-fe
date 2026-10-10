"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
  currency: "USD",
  intent: "subscription",
  vault: true,
};

export default function EmployerPricingPage() {
  const router = useRouter();
  const { user, isEmployer } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [localPrice, setLocalPrice] = useState<string | null>(null);
  const [providerKey, setProviderKey] = useState<number>(Date.now());

  useEffect(() => {
    // Handle bfcache: force remount of PayPal buttons on back navigation
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setProviderKey(Date.now());
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    async function fetchLocalPrice() {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        const ipData = await ipRes.json();
        const currency = ipData.currency;

        if (currency && currency !== "USD") {
          const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
          const rateData = await rateRes.json();
          const rate = rateData.rates[currency];

          if (rate) {
            const converted = Math.round(99 * rate); // $99 * rate
            const formatted = new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency,
              maximumFractionDigits: 0
            }).format(converted);
            setLocalPrice(`approx ${formatted}`);
          }
        }
      } catch (e) {
        console.error("Failed to fetch local currency", e);
      }
    }
    fetchLocalPrice();
  }, []);

  const handleDodoPayment = async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'employer' })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to initialize Dodo Payments");
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error(err);
      setError("Failed to initiate payment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Your job post reaches 5,000+ frontend developers <span className="text-[#10b981]">in 24 hours</span>
          </h1>
          <p className="text-xl text-gray-600">
            Not backend. Not DevOps. Not data scientists. Just React, Next.js, Vue, Angular, and TypeScript engineers actively looking for remote work. Post unlimited jobs for $99/mo.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

          {/* ─── Left Column (Benefits) ─── */}
          <div className="flex-1 w-full flex flex-col gap-8 order-2 lg:order-1">
            <div className="glass-card w-full overflow-hidden p-8 bg-white shadow-xl rounded-2xl border-t-4 border-[#10b981]">
              <h2 className="text-2xl font-bold mb-6">Why Recruiters Choose Us?</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#10b981]/10 rounded-full flex items-center justify-center text-[#10b981]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">100% Frontend Audience</h3>
                    <p className="text-gray-600">Every visitor is a frontend developer. Not a generalist. Not a recruiter. Your React, Next.js, Vue, Angular, and TypeScript roles get seen by exactly the right people.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#10b981]/10 rounded-full flex items-center justify-center text-[#10b981]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Direct Reach to 5,000+ Engineers</h3>
                    <p className="text-gray-600">Every job you post lands in 5,000+ inboxes of frontend-specific subscribers. Not a drip. A blast. Immediate visibility means faster hires.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#10b981]/10 rounded-full flex items-center justify-center text-[#10b981]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Unlimited Jobs. $99/mo. No Per-Post Fees.</h3>
                    <p className="text-gray-600">One job post on LinkedIn costs $300+. Post 10 on Indeed and you're out $2,000+. Post unlimited jobs here for a flat $99/mo.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#10b981]/10 rounded-full flex items-center justify-center text-[#10b981]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Built for Growing Teams & Agencies</h3>
                    <p className="text-gray-600">Hiring 3 engineers or 30? Recruiting for 1 client or 10? One subscription covers every role. No per-post limits. No hidden fees.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Column (Pricing Card) ──────────────── */}
          <div className="w-full lg:w-[420px] shrink-0 order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="glass-card p-6 lg:p-7 border-2 border-[#10b981] bg-white rounded-2xl shadow-2xl relative">

              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#10b981] text-white px-6 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider whitespace-nowrap shadow-md">
                🚀 Frontend Hiring Pro
              </div>

              <div className="text-gray-900 font-semibold tracking-wider uppercase mb-2 text-center mt-4">
                Unlimited Hiring Plan
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-6xl font-extrabold text-gray-900">$99</span>
                  <span className="text-gray-500 mb-2 font-medium">/month</span>
                </div>

                {localPrice && (
                  <div className="text-sm text-[#10b981] mt-3 font-medium bg-[#10b981]/10 px-3 py-1 rounded-full">
                    {localPrice} /month
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-h-[150px]">
                {error && <div className="text-red-500 mb-2 text-center font-medium bg-red-50 p-2 rounded">{error}</div>}

                {!user ? (
                  <button
                    onClick={() => router.push("/auth/signup?redirect=/employers/pricing")}
                    className="w-full py-4 rounded-xl text-white bg-[#2563eb] hover:bg-[#1d4ed8] font-bold text-lg shadow-lg transition-all hover:scale-[1.02]"
                  >
                    Reach 5,000+ Frontend Developers → $99/mo
                  </button>
                ) : user && isEmployer ? (
                  <button
                    onClick={() => router.push("/employers/post")}
                    className="w-full py-4 rounded-xl text-white bg-[#2563eb] hover:bg-[#1d4ed8] font-bold text-lg shadow-lg transition-all hover:scale-[1.02]"
                  >
                    Go to Job Posting Dashboard →
                  </button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={handleDodoPayment}
                      className="w-full py-4 rounded-xl text-white bg-black hover:bg-gray-800 font-bold text-lg shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      Pay with (Cards, Apple Pay, UPI)
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-semibold uppercase">OR</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div className="w-full">
                      <PayPalScriptProvider key={providerKey} options={initialOptions}>
                        <PayPalButtons
                          style={{ layout: "vertical", shape: "rect", color: "black", label: "subscribe" }}
                          createSubscription={async (data, actions) => {
                            const response = await fetch("/api/paypal/create-subscription", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                // Use employer plan ID if exists, otherwise fallback to existing (you must set NEXT_PUBLIC_PAYPAL_EMPLOYER_PLAN_ID in env)
                                plan_id: process.env.NEXT_PUBLIC_PAYPAL_EMPLOYER_PLAN_ID || process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
                                custom_id: user.uid,
                              }),
                            });
                            const result = await response.json();
                            if (!response.ok || !result.id) {
                              throw new Error(result.error || "Failed to create subscription");
                            }
                            return result.id;
                          }}
                          onApprove={async (data, actions) => {
                            alert("🎉 Unlimited Job Posting subscription activated successfully!");
                            router.push("/");
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err);
                            setError("Payment failed or was cancelled. Please try again.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  </div>
                )}

                {user && (
                  <div className="mt-4 text-xs text-gray-500 text-center leading-relaxed">
                    By subscribing, you agree to our <Link href="/legal/terms-of-service" className="text-[#2563eb] hover:underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="text-[#2563eb] hover:underline">Privacy Policy</Link>.
                    Your subscription renews automatically at $99/month until cancelled.
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center leading-relaxed">
                  For any query related to payment, reach out to us at: <br />
                  <a href="mailto:frontendengineersupport@gmail.com" className="text-[#2563eb] hover:underline font-semibold">frontendengineersupport@gmail.com</a>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
