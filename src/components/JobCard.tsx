"use client";

import Link from "next/link";
import { formatSalary, timeAgo, type Job } from "@/lib/jobs";

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

interface JobCardProps {
  job: Job;
  index?: number;
  /** If true, show teaser/blurred state for non-premium users */
  isTeaser?: boolean;
}

export default function JobCard({
  job,
  index = 0,
  isTeaser = false,
}: JobCardProps) {
  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;
  const level = job.experienceLevel
    ? LEVEL_CONFIG[job.experienceLevel]
    : null;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const timeStr = timeAgo(job.postedAt);
  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_GRADIENTS.length;

  // For teaser cards: use the job detail page (shows paywall).
  // For premium cards: link directly to the external apply page if available.
  const slug = job.slug || job.id;
  const internalHref = `/jobs/${slug}`;
  const isExternalLink = !isTeaser && !!job.applyUrl;

  const cardContent = (
    <article
      className={`glass-card p-4 sm:p-5 cursor-pointer group hover:bg-[#111] transition-all ${
        isTeaser ? "relative overflow-hidden" : ""
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Company Logo */}
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 overflow-hidden"
          style={{
            background: job.company?.logoUrl
              ? "var(--bg-secondary)"
              : LOGO_GRADIENTS[gradientIndex],
          }}
        >
          {job.company?.logoUrl ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.name}
              className="w-full h-full object-contain p-1.5"
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

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] sm:text-base group-hover:text-[var(--accent-secondary)] transition-colors leading-tight line-clamp-2">
                {job.title}
              </h3>
              <p
                className="text-sm mt-1 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {isTeaser ? (
                  <span className="blur-[6px] select-none">
                    Premium Company
                  </span>
                ) : (
                  <>
                    {job.company?.name || "Company"}
                    {job.company?.industry && (
                      <span style={{ color: "var(--text-muted)" }}>
                        {" "}
                        · {job.company.industry}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <span
              suppressHydrationWarning
              className="text-xs flex-shrink-0 mt-0 sm:mt-1 order-first sm:order-none"
              style={{ color: "var(--text-muted)" }}
            >
              {timeStr}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
            <span className={`badge ${remote.class}`}>
              {remote.icon} {remote.label}
            </span>

            {level && (
              <span className={`badge ${level.class}`}>{level.label}</span>
            )}

            {job.department && (
              <span
                className="badge"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                {job.department}
              </span>
            )}

            {job.location && !isTeaser && (
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                📍{" "}
                {job.city || job.location}
                {job.country ? `, ${job.country}` : ""}
              </span>
            )}
          </div>

          {/* Salary + Employment type */}
          <div className="flex items-center gap-3 mt-2.5 sm:mt-3">
            {isTeaser ? (
              <span className="salary-text text-sm blur-[6px] select-none">
                $XXK – $XXXK
              </span>
            ) : (
              salary && (
                <span className="salary-text text-sm">{salary}</span>
              )
            )}
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {job.employmentType
                .replace("_", "-")
                .toLowerCase()
                .replace(/^\w/, (c) => c.toUpperCase())}
            </span>
          </div>

          {/* Description preview */}
          {job.description && (
            <p
              className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                isTeaser ? "blur-[4px] select-none" : ""
              }`}
              style={{ color: "var(--text-muted)" }}
            >
              {job.description}
            </p>
          )}
        </div>
      </div>

      {/* Teaser overlay */}
      {isTeaser && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/30 backdrop-blur-[2px] rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-[var(--accent-gradient)] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
            🔒 Subscribe to unlock
          </span>
        </div>
      )}
    </article>
  );

  if (isExternalLink) {
    return (
      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      href={internalHref}
      className="block animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {cardContent}
    </Link>
  );
}
