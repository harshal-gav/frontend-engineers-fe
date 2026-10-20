"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";

// ─── Types ───────────────────────────────────────────────

interface Referral {
  id: string;
  companyName: string;
  roleTitle: string;
  referralLink?: string | null;
  posterName: string;
  posterEmail?: string | null;
  description: string;
  techStack: string[];
  createdAt: string;
  isLocked?: boolean;
}

// ─── Tech Stack Suggestions ──────────────────────────────

const TECH_SUGGESTIONS = [
  "React", "Next.js", "Vue", "Angular", "TypeScript",
  "JavaScript", "Svelte", "Node.js", "Tailwind CSS", "GraphQL",
  "Redux", "CSS", "HTML", "Remix", "Astro",
];

// ─── Time Ago Helper ─────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "recently";
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return "recently";
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Referral Card ───────────────────────────────────────

function ReferralCard({
  referral,
  isProUser,
  onUpgradeClick,
  index,
}: {
  referral: Referral;
  isProUser: boolean;
  onUpgradeClick: () => void;
  index: number;
}) {
  // Pro only: free users see locked and blurred cards
  const isLocked = !isProUser || referral.isLocked === true;
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (referral.posterEmail) {
      navigator.clipboard.writeText(referral.posterEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const cardContent = (
    <article
      className={`glass-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 bg-white rounded-2xl h-full flex flex-col justify-between ${
        isLocked
          ? "job-card-locked cursor-pointer group hover:border-[#d97706]/40 hover:shadow-xl"
          : "hover:border-[#2563eb]/40 hover:shadow-lg"
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div>
        {/* Header - Title & Company remain visible like JobCard on the home page */}
        <div
          className={`flex items-start justify-between gap-3 mb-3 ${
            isLocked ? "relative z-10" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-1 truncate group-hover:text-[#2563eb] transition-colors">
              {referral.roleTitle}
            </h3>
            <p className="text-sm font-semibold text-[#2563eb] truncate">
              {referral.companyName}
            </p>
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-1">
            {timeAgo(referral.createdAt)}
          </span>
        </div>

        {/* Description / Notes */}
        {referral.description && (
          <div className={`mb-3.5 ${isLocked ? "job-locked-blur" : ""}`}>
            <p
              className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line ${
                !isExpanded && referral.description.length > 160
                  ? "line-clamp-3"
                  : ""
              }`}
            >
              {referral.description}
            </p>
            {!isLocked && referral.description.length > 160 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-1 text-xs text-[#2563eb] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                {isExpanded ? "Show less ↑" : "Read full description ↓"}
              </button>
            )}
          </div>
        )}

        {/* Tech stack tags - blurred for locked cards */}
        {Array.isArray(referral.techStack) && referral.techStack.length > 0 && (
          <div
            className={`flex flex-wrap gap-1.5 mb-4 ${
              isLocked ? "job-locked-blur" : ""
            }`}
          >
            {referral.techStack.map((tech) => (
              <span key={tech} className="tech-tag">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Referral info, Email & Apply link */}
      <div
        className={`pt-3.5 border-t border-[#e2e2e6] mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLocked ? "job-locked-blur" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb] text-xs font-bold shrink-0">
            {(referral.posterName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate leading-tight">
              Referred by{" "}
              <span className="font-semibold text-gray-800">
                {referral.posterName || "Anonymous"}
              </span>
            </p>

            {/* Email for Pro Users */}
            {!isLocked && referral.posterEmail ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <a
                  href={`mailto:${referral.posterEmail}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#2563eb] hover:underline font-medium truncate flex items-center gap-1 max-w-[180px] sm:max-w-[200px]"
                  title={`Email ${referral.posterEmail}`}
                >
                  <svg
                    className="w-3 h-3 shrink-0 text-[#2563eb]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">{referral.posterEmail}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors shrink-0"
                  title="Copy email address"
                  aria-label="Copy email"
                >
                  {copiedEmail ? (
                    <span className="text-[10px] font-bold text-emerald-600">
                      Copied!
                    </span>
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ) : isLocked ? (
              <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="blur-[3px] select-none">
                  engineer@company.com
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Actions: Contact & Apply */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLocked && referral.posterEmail && (
            <a
              href={`mailto:${referral.posterEmail}?subject=${encodeURIComponent(
                `Referral inquiry for ${referral.roleTitle} at ${referral.companyName}`
              )}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-bold transition-colors shrink-0 flex items-center gap-1"
              title="Email the referrer directly"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact
            </a>
          )}

          {!isLocked && referral.referralLink && (
            <a
              href={referral.referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm bg-[#2563eb] text-white px-3 sm:px-4 py-1.5 rounded-full font-bold hover:bg-[#1d4ed8] transition-colors shrink-0 flex items-center gap-1 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                trackEvent("referral_link_clicked", {
                  company: referral.companyName,
                });
              }}
            >
              Apply
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Lock overlay badge for locked cards */}
      {isLocked && (
        <span className="job-locked-badge">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Unlock with Pro
        </span>
      )}
    </article>
  );

  if (isLocked) {
    return (
      <Link
        href="/pricing"
        onClick={onUpgradeClick}
        className="block h-full animate-fade-in-up"
      >
        {cardContent}
      </Link>
    );
  }

  return <div className="h-full animate-fade-in-up">{cardContent}</div>;
}


// ─── Post Referral Form ──────────────────────────────────

function PostReferralForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    roleTitle: "",
    referralLink: "",
    posterName: "",
    posterEmail: "",
    description: "",
    techStack: "",
  });
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech].slice(0, 10)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Merge selected tags with any typed ones
    const allTech = [
      ...selectedTech,
      ...formData.techStack
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && !selectedTech.includes(t)),
    ];

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          techStack: allTech,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      trackEvent("referral_posted", { company: formData.companyName });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to post referral");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Post a Referral
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Help a fellow engineer land a remote frontend role
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Google, Stripe, Vercel"
                className="input"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>

            {/* Role Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Role Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="e.g. Senior Frontend Engineer"
                className="input"
                value={formData.roleTitle}
                onChange={(e) =>
                  setFormData({ ...formData, roleTitle: e.target.value })
                }
              />
            </div>

            {/* Referral / Apply Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Referral / Apply Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                className="input"
                value={formData.referralLink}
                onChange={(e) =>
                  setFormData({ ...formData, referralLink: e.target.value })
                }
              />
            </div>

            {/* Your Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="John Doe"
                  className="input"
                  value={formData.posterName}
                  onChange={(e) =>
                    setFormData({ ...formData, posterName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="input"
                  value={formData.posterEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, posterEmail: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description / Notes
              </label>
              <textarea
                maxLength={1000}
                rows={3}
                placeholder="Any details about the role, team, or referral process..."
                className="input resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TECH_SUGGESTIONS.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                      selectedTech.includes(tech)
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-white text-gray-600 border-[#e2e2e6] hover:border-[#2563eb] hover:text-[#2563eb]"
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type custom: e.g. Playwright, Storybook"
                className="input text-xs"
                value={formData.techStack}
                onChange={(e) =>
                  setFormData({ ...formData, techStack: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3.5 rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Post Referral - It&apos;s Free
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast ───────────────────────────────────────

function SuccessToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="bg-[#059669] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="font-semibold text-sm">
          Referral posted successfully! 🎉
        </span>
        <button onClick={onClose} className="ml-2 hover:opacity-75">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function ReferralsPage() {
  const { user, loading: authLoading, isSubscribed } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        } catch (e) {
          console.error("Error getting id token:", e);
        }
      }

      const res = await fetch("/api/referrals", {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setReferrals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    await fetchReferrals();
    setIsRefreshing(false);
    setRefreshNotice("Checked just now. Waiting for other referrals to populate.");
    setTimeout(() => setRefreshNotice(null), 4000);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchReferrals();
    trackEvent("referrals_page_viewed");
  }, [authLoading, fetchReferrals]);

  const handlePostSuccess = () => {
    setShowForm(false);
    setShowSuccess(true);
    fetchReferrals();
  };

  const totalReferrals = referrals.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] w-full max-w-full overflow-x-clip">
      {/* ─── Header ─────────────────────────────── */}
      <header className="border-b border-[#e2e2e6] bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 sm:gap-3 max-w-full hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm bg-[#2563eb] shrink-0">
              FE
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
              FrontendEngineers.com
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 relative max-w-full">
            <Link
              href="/"
              className="text-xs sm:text-sm bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0"
            >
              Jobs
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0"
            >
              Dashboard
            </Link>
            {!user && (
              <Link
                href="/auth/login?redirect=/referrals"
                className="text-xs sm:text-sm bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0"
              >
                Log In
              </Link>
            )}
            {!isSubscribed && (
              <Link
                href="/pricing"
                className="text-xs sm:text-sm bg-[#d97706] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold shadow-md hover:bg-[#b45309] hover:shadow-lg transition-all flex items-center justify-center shrink-0"
              >
                ⭐ Get Pro
              </Link>
            )}
            {isSubscribed && (
              <span className="text-[10px] sm:text-xs bg-[#d97706] text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider leading-none">
                Pro
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────── */}
      <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 text-center bg-white border-b border-[#e2e2e6]">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center gap-1.5 bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-5 shadow-sm uppercase tracking-wider">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Community Referrals
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight text-gray-900">
            Remote Frontend{" "}
            <span className="text-[#2563eb]">Referrals</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto mb-6 leading-relaxed">
            Real engineers sharing real referral links. Get a direct line to
            companies hiring remote frontend developers. Post yours for free!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setShowForm(true);
                trackEvent("referral_form_opened");
              }}
              className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Post a Referral - Free
            </button>
            {!isSubscribed && (
              <Link
                href="/pricing"
                className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                ⭐ Unlock All Referrals
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────── */}
      <div className="bg-white border-b border-[#e2e2e6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {isSubscribed ? (
            totalReferrals === 0 ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  All referrals consumed
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Waiting for other referrals to populate
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{totalReferrals}</span>{" "}
                referral{totalReferrals !== 1 ? "s" : ""} available
              </p>
            )
          ) : (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                Community Referrals
              </span>
              <span className="text-[#d97706] ml-2 font-semibold">
                · Pro members only
              </span>
            </p>
          )}
          <button
            onClick={() => {
              setShowForm(true);
              trackEvent("referral_form_opened");
            }}
            className="text-xs sm:text-sm text-[#2563eb] font-bold hover:underline flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Share Referral
          </button>
        </div>
      </div>

      {/* ─── Referrals Grid ─────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="h-5 w-3/4 skeleton mb-2 rounded" />
                    <div className="h-4 w-1/3 skeleton rounded" />
                  </div>
                  <div className="h-4 w-12 skeleton rounded" />
                </div>
                <div className="h-4 w-full skeleton mb-2 rounded" />
                <div className="h-4 w-2/3 skeleton mb-3 rounded" />
                <div className="flex gap-1.5 mb-4">
                  <div className="h-5 w-16 skeleton rounded-full" />
                  <div className="h-5 w-14 skeleton rounded-full" />
                  <div className="h-5 w-20 skeleton rounded-full" />
                </div>
                <div className="h-px bg-[#e2e2e6] mb-3" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 skeleton rounded-full" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                  <div className="h-8 w-16 skeleton rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : referrals.length === 0 ? (
          isSubscribed ? (
            <div className="py-8 sm:py-12 animate-fade-in-up">
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-amber-200/80 shadow-xl shadow-amber-500/5 p-6 sm:p-10 text-center relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-amber-100/60 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Pro Status Header Tag */}
                <div className="relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border border-amber-300 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="tracking-wide uppercase text-[11px]">Pro Member Access</span>
                  <span className="text-amber-400">•</span>
                  <span>Live Pool</span>
                </div>

                {/* Main Icon */}
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-amber-100 rotate-6" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 opacity-90 shadow-lg shadow-orange-500/20" />
                  <svg
                    className="relative w-9 h-9 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* Title & Description */}
                <h2 className="relative text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                  All Referrals Consumed
                </h2>
                <p className="relative text-gray-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
                  All current community referrals have been claimed. Please wait while other referrals populate as verified engineers from top tech companies share new openings.
                </p>

                {/* Live Status Informational Cards */}
                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-8">
                  <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⏳</span>
                      <span className="text-xs font-bold text-gray-900">Auto-Populating</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      New referrals populate as community members share active openings.
                    </p>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⭐</span>
                      <span className="text-xs font-bold text-gray-900">Instant Access</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Your Pro status grants immediate 1-click access the second they drop.
                    </p>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🤝</span>
                      <span className="text-xs font-bold text-gray-900">Pay It Forward</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Hiring at your team? Share a referral link to help a fellow engineer.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
                  >
                    <svg
                      className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isRefreshing ? "Checking Feed..." : "Check for New Referrals"}
                  </button>

                  <button
                    onClick={() => {
                      setShowForm(true);
                      trackEvent("referral_form_opened");
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm"
                  >
                    <svg
                      className="w-4 h-4 text-[#2563eb]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Post a Referral
                  </button>

                  <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold px-4 py-2 transition-colors"
                  >
                    Browse Remote Jobs →
                  </Link>
                </div>

                {refreshNotice && (
                  <p className="mt-4 text-xs text-amber-700 font-medium animate-fade-in">
                    {refreshNotice}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#eff6ff] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg
                  className="w-10 h-10 text-[#2563eb]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Community Referrals
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Verified employee referrals from top tech companies will appear here for Pro members. Have an open role at your company? Share a referral to support fellow frontend developers!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                  Share a Referral - Free
                </button>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all"
                >
                  ⭐ Get Pro Access
                </Link>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((referral, index) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  isProUser={isSubscribed}
                  onUpgradeClick={() => trackEvent("referral_upgrade_clicked")}
                  index={index}
                />
              ))}
            </div>

            {/* Upgrade CTA at bottom for free users */}
            {!isSubscribed && referrals.length > 0 && (
              <div className="mt-8 text-center py-10 bg-white rounded-2xl border-2 border-dashed border-[#d97706]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fffbeb]/50 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-2xl font-extrabold text-gray-900 mb-2">
                    ⭐ Unlock All Referrals
                  </p>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Pro members get full access to every referral link, direct
                    contacts, and all job portal features for just $9/month.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all"
                  >
                    Upgrade to Pro - $9/mo
                  </Link>
                  <p className="mt-3 text-xs text-gray-400">
                    Cancel anytime. No commitments.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Post Form Modal ────────────────────── */}
      {showForm && (
        <PostReferralForm
          onSuccess={handlePostSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ─── Success Toast ──────────────────────── */}
      {showSuccess && (
        <SuccessToast onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}
