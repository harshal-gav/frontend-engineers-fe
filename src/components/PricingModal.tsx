"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubscribe = async (plan: "PRO" | "PREMIUM") => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to initiate checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Error initiating checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card p-8 rounded-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Unlock Full Access</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Get instant access to apply links, full job descriptions, advanced filters, and real-time alerts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pro Plan */}
          <div className="border border-[var(--border-subtle)] rounded-xl p-8 bg-[var(--bg-secondary)] flex flex-col">
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$12</span>
              <span className="text-[var(--text-muted)]">/month</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">
              Perfect for active job seekers who want direct access to hiring managers.
            </p>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-[var(--green)]">✓</span> View full job descriptions
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--green)]">✓</span> Direct Apply links to company ATS
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--green)]">✓</span> 5 saved searches & alerts
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--green)]">✓</span> Standard support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("PRO")}
              disabled={loading}
              className="btn-secondary w-full py-3"
            >
              Get Pro
            </button>
          </div>

          {/* Premium Plan */}
          <div className="relative border-2 border-[var(--accent-primary)] rounded-xl p-8 bg-[var(--bg-secondary)] flex flex-col shadow-[0_0_30px_var(--accent-glow)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-gradient)] text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-[var(--text-muted)]">/month</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">
              For professionals seeking the absolute edge in their career hunt.
            </p>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-[var(--accent-primary)]">✓</span> Everything in Pro
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--accent-primary)]">✓</span> Unlimited saved searches & alerts
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--accent-primary)]">✓</span> Instant email notifications for new jobs
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--accent-primary)]">✓</span> Priority support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("PREMIUM")}
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              Get Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
