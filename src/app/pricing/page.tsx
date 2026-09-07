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
    <div className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get{" "}
            <span className="text-[#00ffcc]">7-Day Early Access</span>{" "}
            to New Jobs
          </h1>
          <p className="text-xl text-gray-400">
            See new remote frontend jobs before everyone else. Fewer applicants means
            easier interview calls. Get fresh jobs delivered to your inbox daily.
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
                      <th className="text-center">Pro (Early Access)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Job visibility</td>
                      <td className="muted-cell text-center">After 7 days</td>
                      <td className="highlight-cell text-center">✓ Immediately when posted</td>
                    </tr>
                    <tr>
                      <td>Daily email alerts</td>
                      <td className="muted-cell text-center">❌</td>
                      <td className="highlight-cell text-center">✓ Fresh jobs in your inbox</td>
                    </tr>
                    <tr>
                      <td>Applicant competition</td>
                      <td className="muted-cell text-center">High (100s of applicants)</td>
                      <td className="highlight-cell text-center">✓ Low — be among the first 10</td>
                    </tr>
                    <tr>
                      <td>Salary & apply links</td>
                      <td className="muted-cell text-center">✓ Visible</td>
                      <td className="highlight-cell text-center">✓ Visible</td>
                    </tr>
                    <tr>
                      <td>Filters & search</td>
                      <td className="muted-cell text-center">✓ Available</td>
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
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-2">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-xs font-bold text-[#00ffcc] border border-[#333]">
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>

          {/* ─── Right Column (Pricing Card) ──────────────── */}
          {/* Order 1 on mobile (top of the page), Order 2 on desktop (right side) */}
          <div className="w-full lg:w-[420px] shrink-0 order-1 lg:order-2">
            <div className="glass-card p-8 border border-[#333] bg-[#111] rounded-2xl">
              <div className="text-[#00ffcc] font-semibold tracking-wider uppercase mb-2 text-center">
                Pro Membership
              </div>
              <div className="flex flex-col items-center mb-2">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold text-white">$9</span>
                  <span className="text-gray-400 mb-1">/month</span>
                </div>

                {localPrice && (
                  <div className="text-sm text-[#00ffcc] mt-3 font-medium bg-[#00ffcc]/10 px-3 py-1 rounded-full">
                    {localPrice} /month
                  </div>
                )}
              </div>

              {/* Cancel anytime line */}
              <p className="text-xs text-gray-500 mb-6 text-center">
                Cancel anytime — no commitments.
              </p>

              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00ffcc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>See new jobs <strong>7 days before</strong> everyone else</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00ffcc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Daily email alerts with fresh jobs in your inbox</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00ffcc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Fewer applicants = easier to get interview calls</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00ffcc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Apply before the crowd — be among the first 10</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#00ffcc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>100% remote, frontend-only, curated daily</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3 min-h-[150px]">
                {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
                
                {!user ? (
                  <button
                    onClick={() => router.push("/auth/signup?redirect=/pricing")}
                    className="w-full btn-primary py-3 rounded text-black bg-[#00ffcc] font-bold text-lg"
                  >
                    ⚡ Get Early Access for $9/mo
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
                      <div className="flex-grow border-t border-[#333]"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
                      <div className="flex-grow border-t border-[#333]"></div>
                    </div>

                    <button
                      onClick={handlePayUSubscription}
                      className="w-full py-3 rounded text-white bg-[#10b981] font-bold text-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                    >
                      Payment for Indian Users (UPI / Cards)
                    </button>
                  </div>
                )}
                
                {user && (
                  <div className="mt-4 text-xs text-gray-500 text-center leading-relaxed">
                    By subscribing, you agree to our <Link href="/legal/terms-of-service" className="text-[#00ffcc] hover:underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="text-[#00ffcc] hover:underline">Privacy Policy</Link>. 
                    Your subscription renews automatically at $9/month until cancelled.
                  </div>
                )}

                <button
                  onClick={() => router.push("/")}
                  className="w-full text-gray-400 hover:text-white py-3 transition-colors underline mt-4"
                >
                  Browse free jobs (7-day delay)
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
