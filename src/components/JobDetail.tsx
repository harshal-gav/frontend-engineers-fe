"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatSalary, type Job } from "@/lib/jobs";

// ─── Config ──────────────────────────────────────────────

const REMOTE_CONFIG = {
  REMOTE: { label: "Remote", class: "badge-remote", icon: "🌍" },
  HYBRID: { label: "Hybrid", class: "badge-hybrid", icon: "🏢" },
  ONSITE: { label: "On-site", class: "badge-onsite", icon: "📍" },
} as const;

const LEVEL_CONFIG = {
  ENTRY: { label: "Entry Level", class: "badge-entry" },
  MID: { label: "Mid Level", class: "badge-mid" },
  SENIOR: { label: "Senior", class: "badge-senior" },
  LEAD: { label: "Lead / Executive", class: "badge-lead" },
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
  /** Server-rendered premium status — if false, show paywall */
  isPremium: boolean;
}

export default function JobDetail({ job, isPremium }: JobDetailProps) {
  const { isSubscribed } = useAuth();
  // Use client-side state if available, fall back to server-rendered prop
  const canAccess = isSubscribed || isPremium;

  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;
  const level = job.experienceLevel
    ? LEVEL_CONFIG[job.experienceLevel]
    : null;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_GRADIENTS.length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ─── Header / Back Nav ────────────────────── */}
      <header className="border-b border-[var(--border-card)] bg-[var(--bg-primary)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link
            href="/"
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
        {/* Company + Title */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden"
            style={{
              background: job.company?.logoUrl
                ? "var(--bg-secondary)"
                : LOGO_GRADIENTS[gradientIndex],
            }}
          >
            {canAccess && job.company?.logoUrl ? (
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
              (job.company?.name || "?")[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1">
              {job.title}
            </h1>
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

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`badge ${remote.class}`}>
          {remote.icon} {remote.label}
        </span>
        {level && (
          <span className={`badge ${level.class}`}>{level.label}</span>
        )}
        <span
          className="badge"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          {job.employmentType
            .replace("_", "-")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase())}
        </span>
        {!canAccess ? (
          <span
            className="locked-field text-sm text-[var(--text-muted)]"
            aria-label="Location locked"
          >
            📍 New York, US
          </span>
        ) : job.location ? (
          <span className="text-sm text-[var(--text-muted)]">
            📍 {job.city || job.location}
            {job.country ? `, ${job.country}` : ""}
          </span>
        ) : null}
      </div>

      {/* Salary */}
      {canAccess && salary ? (
        <div className="glass-card p-4 sm:p-5 mb-6">
          <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
            Salary Range
          </div>
          <div className="salary-text text-lg sm:text-xl font-bold">
            {salary}
          </div>
        </div>
      ) : !canAccess ? (
        <div className="glass-card p-4 sm:p-5 mb-6 relative overflow-hidden">
          <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
            Salary Range
          </div>
          <div className="salary-text text-lg sm:text-xl font-bold">
            $XXK – $XXXK/year
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/50">
            <span className="text-sm font-medium text-[var(--accent-secondary)]">
              🔒 Premium only
            </span>
          </div>
        </div>
      ) : null}

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        {canAccess ? (
          <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {job.description || "No description available."}
          </div>
        ) : (
          <div className="relative">
            <div className="text-[var(--text-secondary)] leading-relaxed blur-[6px] select-none whitespace-pre-wrap">
              {(job.description || "This is a premium job listing with detailed description about the role, responsibilities, and requirements. Subscribe to see the full details and apply directly.").substring(
                0,
                300
              )}
              ...
            </div>
            {/* Paywall overlay */}
            <div className="mt-6 text-center p-6 sm:p-8 glass-card border border-[var(--border-subtle)] rounded-2xl">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-xl font-bold mb-2">
                Unlock Full Job Details
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-md mx-auto">
                Subscribe to see the full description, salary details, and apply directly.
              </p>
                <Link
                  href="/pricing"
                  className="btn-primary inline-flex items-center justify-center min-h-[48px] px-8 text-base"
                >
                  Unlock full listings with $9/mo
                </Link>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Apply Button */}
      {(job.applyUrl || !canAccess) && (
        <div className="hidden sm:block">
          {canAccess ? (
            <a
              href={job.applyUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex min-h-[48px] px-8 text-base"
            >
              Apply Now →
            </a>
          ) : (
            <Link
              href="/pricing"
              className="btn-primary inline-flex min-h-[48px] px-8 text-base bg-gradient-to-r from-[#00ffcc] to-[#00ccaa] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:scale-105 transition-all"
            >
              <span className="mr-2">🔒</span> Unlock full listings with $9/mo
            </Link>
          )}
        </div>
      )}
    </main>

      {/* ─── Mobile Sticky Apply CTA ─────────────── */}
      {canAccess && job.applyUrl && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:hidden z-30 border-t border-[var(--border-card)]"
          style={{
            background: "var(--bg-primary)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="px-4 py-3">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center"
            >
              Apply Now →
            </a>
          </div>
        </div>
      )}

      {/* Mobile paywall CTA if not premium */}
      {!canAccess && (
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
              className="btn-primary w-full min-h-[48px] text-base font-bold rounded-xl flex items-center justify-center bg-gradient-to-r from-[#00ffcc] to-[#00ccaa] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]"
            >
              🔒 <span className="ml-1">Unlock full listings with $9/mo</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
