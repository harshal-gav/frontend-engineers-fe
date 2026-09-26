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

// ─── Testimonials data ──────────────────────────────────
// Add real testimonials here when available.
// The section will automatically hide if this array is empty.
const TESTIMONIALS: { name: string; role: string; quote: string; avatar?: string }[] = [
  // Example:
  // { name: "Jane D.", role: "Senior Frontend Engineer", quote: "Found my current role here in under a week. The curated listings saved me hours of sifting through irrelevant posts." },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [localPrice, setLocalPrice] = useState<string | null>(null);
  const [providerKey, setProviderKey] = useState<number>(Date.now());
  const [stats, setStats] = useState<{ jobCount: number; companyCount: number } | null>(null);

  useEffect(() => {
    // Handle bfcache: if the user navigates back to this page, 
    // the PayPal zoid components might be destroyed. Force a remount.
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
            const converted = Math.round(9 * rate); // $9 * rate
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

  // Fetch dynamic stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    }
    fetchStats();
  }, []);


  const handlePayUSubscription = async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch("/api/payu/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to initialize PayU");
        return;
      }

      // Dynamically create and submit a form to PayU
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", data.action);

      Object.keys(data.params).forEach((key) => {
        const hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", data.params[key]);
        form.appendChild(hiddenField);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error(err);
      setError("Failed to initiate PayU payment");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12 flex flex-col items-center">
          <div className="inline-flex items-center justify-center gap-1.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-sm uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Aggregated from 100+ job boards &amp; company career pages. Save hours of searching!
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 w-full">
            Find remote frontend jobs <span className="text-[#2563eb]">faster.</span>
          </h1>
          <p className="text-xl text-gray-600">
            Browse every remote frontend job for free. Upgrade to Pro to unlock
            advanced search, full descriptions, direct apply links, and daily alerts.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

          {/* ─── Left Column (Table, Stats, Testimonials) ─── */}
          {/* Order 2 on mobile (below pricing), Order 1 on desktop (left side) */}
          <div className="flex-1 w-full flex flex-col gap-8 order-2 lg:order-1">

            {/* ─── Why Pay? Comparison Table ─────────── */}
            <div className="glass-card w-full overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="comparison-table w-full min-w-[300px]">
                  <thead>
                    <tr>
                      <th></th>
                      <th className="text-center">Free</th>
                      <th className="text-center">Pro Membership</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>AI-Powered Filters (Tech Stack, Global Remote, Seniority)</td>
                      <td className="muted-cell text-center">🔒 Pro only</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                    <tr>
                      <td>Full job descriptions & requirements</td>
                      <td className="muted-cell text-center">🔒 Pro only</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                    <tr>
                      <td>Direct apply links to company career pages</td>
                      <td className="muted-cell text-center">🔒 Pro only</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                    <tr>
                      <td>Daily email alerts with fresh jobs in your inbox</td>
                      <td className="muted-cell text-center">❌</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                    <tr>
                      <td>100% remote, frontend-only, curated daily</td>
                      <td className="muted-cell text-center">✓ Available</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                    <tr>
                      <td>Save your searches as 1-click Filter Presets</td>
                      <td className="muted-cell text-center">🔒 Pro only</td>
                      <td className="highlight-cell text-center">✓ Available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Trust Stats ────────────────────────── */}
            {stats && (stats.jobCount > 0 || stats.companyCount > 0) && (
              <div className="flex justify-center gap-12 sm:gap-16">
                {stats.jobCount > 0 && (
                  <div className="trust-stat">
                    <span className="trust-stat-number">{stats.jobCount}+</span>
                    <span className="trust-stat-label">remote roles curated<br />this month</span>
                  </div>
                )}
                {stats.companyCount > 0 && (
                  <div className="trust-stat">
                    <span className="trust-stat-number">{stats.companyCount}+</span>
                    <span className="trust-stat-label">companies<br />sourced</span>
                  </div>
                )}
              </div>
            )}

            {/* ─── Testimonials (hidden when empty) ──── */}
            {TESTIMONIALS.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="glass-card p-5 text-left">
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-2">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#2563eb] border border-[#e2e2e6]">
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-600">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ─── Right Column (Pricing Card) ──────────────── */}
          {/* Order 1 on mobile (top of the page), Order 2 on desktop (right side) */}
          <div className="w-full lg:w-[420px] shrink-0 order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="glass-card p-6 lg:p-7 border border-[#e2e2e6] bg-white rounded-2xl">
              <div className="text-[#2563eb] font-semibold tracking-wider uppercase mb-2 text-center">
                Pro Membership
              </div>
              <div className="flex flex-col items-center mb-2">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">$9</span>
                  <span className="text-gray-600 mb-1">/month</span>
                </div>

                {localPrice && (
                  <div className="text-sm text-[#2563eb] mt-3 font-medium bg-[#2563eb]/10 px-3 py-1 rounded-full">
                    {localPrice} /month
                  </div>
                )}
              </div>

              {/* Cancel anytime line */}
              <p className="text-xs text-gray-600 mb-6 text-center">
                Cancel anytime - no commitments.
              </p>

              <ul className="mb-6 space-y-3 text-left text-sm lg:text-base">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>AI-Powered Search & Filters (Tech Stack, Remote Scope)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Full job descriptions & requirements</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Direct apply links to company career pages</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Daily email alerts with fresh jobs in your inbox</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>100% remote, frontend-only, curated daily</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Save your custom 1-click Filter Presets</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3 min-h-[150px]">
                {error && <div className="text-red-500 mb-2 text-center">{error}</div>}

                {!user ? (
                  <button
                    onClick={() => router.push("/auth/signup?redirect=/pricing")}
                    className="w-full py-3 rounded-full text-white bg-[#d97706] hover:bg-[#b45309] font-bold text-lg shadow-lg shadow-orange-500/20 transition-colors"
                  >
                    ⭐ Get Pro Membership for $9/month
                  </button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="w-full">
                      <PayPalScriptProvider key={providerKey} options={initialOptions}>
                        <PayPalButtons
                          style={{ layout: "vertical", shape: "rect", color: "gold" }}
                          createSubscription={async (data, actions) => {
                            const response = await fetch("/api/paypal/create-subscription", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
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
                            alert("🎉 Subscription created successfully! Your account will be upgraded momentarily.");
                            router.push("/");
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err);
                            setError("Payment failed or was cancelled. Please try again.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-[#e2e2e6]"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-600 text-sm">OR</span>
                      <div className="flex-grow border-t border-[#e2e2e6]"></div>
                    </div>

                    <button
                      onClick={handlePayUSubscription}
                      className="w-full py-3 rounded text-gray-900 bg-[#10b981] font-bold text-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                    >
                      Payment for Indian Users (UPI / Cards)
                    </button>
                  </div>
                )}

                {user && (
                  <div className="mt-4 text-xs text-gray-600 text-center leading-relaxed">
                    By subscribing, you agree to our <Link href="/legal/terms-of-service" className="text-[#2563eb] hover:underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="text-[#2563eb] hover:underline">Privacy Policy</Link>.
                    Your subscription renews automatically at $9/month until cancelled.
                  </div>
                )}

                <button
                  onClick={() => router.push("/")}
                  className="w-full text-gray-600 hover:text-gray-900 py-3 transition-colors underline mt-2"
                >
                  Browse job titles (free)
                </button>

                <div className="mt-4 pt-4 border-t border-[#e2e2e6] text-xs text-gray-500 text-center leading-relaxed">
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
