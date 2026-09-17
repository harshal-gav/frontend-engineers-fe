"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { type Job } from "@/lib/jobs";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAuth } from "firebase/auth";

// ─── Config ──────────────────────────────────────────────

const REMOTE_CONFIG = {
  REMOTE: { label: "Remote", class: "badge-remote", icon: "🌍" },
  HYBRID: { label: "Hybrid", class: "badge-hybrid", icon: "🏢" },
  ONSITE: { label: "On-site", class: "badge-onsite", icon: "📍" },
} as const;



const LOGO_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #f43f5e, #ec4899)",
  "linear-gradient(135deg, #10b981, #14b8a6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
];

// ─── Component ───────────────────────────────────────────

interface JobDetailProps {
  job: Job;
}

export default function JobDetail({ job: initialJob }: JobDetailProps) {
  const { user, isSubscribed, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [job, setJob] = useState<Job>(initialJob);

  const paramsString = searchParams?.toString();
  const backHref = paramsString ? `/?${paramsString}` : "/";

  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;

  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_GRADIENTS.length;

  // Determine if the content should be locked (non-subscribed user)
  // Wait for auth to finish loading before showing the lock state
  const showLocked = !authLoading && !isSubscribed;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ─── Header / Back Nav ────────────────────── */}
      <header className="border-b border-[var(--border-card)] bg-[var(--bg-primary)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] transition-colors min-h-[44px] min-w-[44px] justify-center sm:justify-start"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Jobs</span>
          </Link>
        </div>
      </header>

      {/* ─── Job Content ──────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">
        {/* Company + Title — Title is always visible */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-gray-900 font-bold text-xl flex-shrink-0 overflow-hidden"
            style={{
              background: job.company?.logoUrl
                ? "var(--bg-secondary)"
                : LOGO_GRADIENTS[gradientIndex],
            }}
          >
            {job.company?.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={`${job.company.name || 'Company'} logo`}
                className="w-full h-full object-contain p-2"
                width={64}
                height={64}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.textContent =
                    (job.company?.name || "?")[0];
                }}
              />
            ) : (
              <span>{(job.company?.name || "?")[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Title is ALWAYS visible */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                {job.title}
              </h1>
            </div>
            {/* Company name - visible to all users */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)]">
            {job.company?.name}
            {job.company?.industry && (
              <span className="text-[var(--text-muted)]">
                {" "}
                · {job.company.industry}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Pro Upgrade CTA for Free Users ─────── */}
      {showLocked && (
        <div className="job-detail-locked-cta">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Unlock Full Job Details</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                See the full description and apply link for this job. 
                Pro members get full access to every job + daily email alerts.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-colors text-base"
            >
              ⭐ Get Pro - $9/month
            </Link>
            <p className="text-xs text-gray-500">Cancel anytime. Instant access.</p>
          </div>
        </div>
      )}

      {/* Badges — blurred for free users */}
      <div className={`flex flex-wrap items-center gap-2 mb-6 ${showLocked ? "locked-content" : ""}`}>
        <span className={`badge ${remote.class} ${showLocked ? "job-locked-blur" : ""}`}>
          {remote.icon} {remote.label}
        </span>

        {job.location && (
          <span className={`text-sm text-[var(--text-muted)] ${showLocked ? "job-locked-blur" : ""}`}>
            📍 {showLocked ? "Location, Country" : (job.location + (job.country ? `, ${job.country}` : ""))}
          </span>
        )}
      </div>


      {/* Apply Button (Desktop) — only for Pro users */}
      {!showLocked && job.applyUrl && (
        <div className="hidden sm:block mb-8">
          {user ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex min-h-[48px] px-8 text-base"
            >
              Apply Now →
            </a>
          ) : (
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
              className="btn-primary inline-flex min-h-[48px] px-8 text-base items-center justify-center"
            >
              Login to Apply →
            </Link>
          )}
        </div>
      )}

      {/* Description — blurred for free users */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        <div className={`prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ${showLocked ? "job-locked-blur" : ""}`}>
          {job.description || "No description available."}
        </div>
      </div>
    </main>

      {/* ─── Mobile Sticky Apply CTA ─────────────── */}
      {!showLocked && job.applyUrl && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:hidden z-30 border-t border-[var(--border-card)]"
          style={{
            background: "var(--bg-primary)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="px-4 py-3">
            {user ? (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center"
              >
                Apply Now →
              </a>
            ) : (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center"
              >
                Login to Apply →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─── Mobile Sticky Pro CTA for Free Users ── */}
      {showLocked && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:hidden z-30 border-t border-[var(--border-card)]"
          style={{
            background: "var(--bg-primary)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="px-4 py-3">
            <Link
              href="/pricing"
              className="bg-[#d97706] hover:bg-[#b45309] text-white w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              🔒 Unlock Full Details - $9/mo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
