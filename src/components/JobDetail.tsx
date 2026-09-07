"use client";

import Link from "next/link";
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
  /** Server-rendered premium status — used to show early access badge */
  isPremium: boolean;
}

export default function JobDetail({ job, isPremium }: JobDetailProps) {
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
              (job.company?.name || "?")[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                {job.title}
              </h1>
              {job.isEarlyAccess && (
                <span className="text-xs bg-[#00ffcc]/15 text-[#00ffcc] px-2.5 py-1 rounded-full font-semibold border border-[#00ffcc]/30 whitespace-nowrap">
                  ⚡ Early Access
                </span>
              )}
            </div>
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
        {job.location && (
          <span className="text-sm text-[var(--text-muted)]">
            📍 {job.city || job.location}
            {job.country ? `, ${job.country}` : ""}
          </span>
        )}
      </div>

      {/* Salary */}
      {salary && (
        <div className="glass-card p-4 sm:p-5 mb-6">
          <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
            Salary Range
          </div>
          <div className="salary-text text-lg sm:text-xl font-bold">
            {salary}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Job Description</h2>
        <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {job.description || "No description available."}
        </div>
      </div>

      {/* Apply Button */}
      {job.applyUrl && (
        <div className="hidden sm:block">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex min-h-[48px] px-8 text-base"
          >
            Apply Now →
          </a>
        </div>
      )}
    </main>

      {/* ─── Mobile Sticky Apply CTA ─────────────── */}
      {job.applyUrl && (
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
    </div>
  );
}
