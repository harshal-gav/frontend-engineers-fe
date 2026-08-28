"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [localPrice, setLocalPrice] = useState<string | null>(null);

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

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "subscription",
    vault: true,
  };

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
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Unlock the Best{" "}
          <span className="text-[#00ffcc]">Frontend & JavaScript</span> Jobs
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Stop sifting through irrelevant listings. Get curated React, Vue,
          Angular, Node.js, and Fullstack jobs sent straight to you.
        </p>

        <div className="glass-card max-w-md mx-auto p-8 border border-[#333] bg-[#111] rounded-2xl">
          <div className="text-[#00ffcc] font-semibold tracking-wider uppercase mb-2">
            Pro Membership
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-bold">$9</span>
              <span className="text-gray-400 mb-1">/month</span>
            </div>
            {localPrice && (
              <div className="text-sm text-[#00ffcc] mt-1 font-medium bg-[#00ffcc]/10 px-3 py-1 rounded-full">
                {localPrice} /month
              </div>
            )}
          </div>

          <ul className="text-left space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ffcc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Unlimited access to all premium remote jobs</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ffcc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Direct apply links to company ATS</span>
            </li>
          </ul>

          <div className="flex flex-col gap-3 min-h-[150px]">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            
            {!user ? (
              <button
                onClick={() => router.push("/auth/signup")}
                className="w-full btn-primary py-3 rounded text-black bg-[#00ffcc] font-bold text-lg"
              >
                Create Account to Subscribe
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <PayPalScriptProvider options={initialOptions}>
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
                  Pay with PayU (UPI / Cards)
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
              Continue to portal (Free Preview)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
