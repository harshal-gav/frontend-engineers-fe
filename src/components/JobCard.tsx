"use client";

import Link from "next/link";

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  remoteType: "REMOTE" | "HYBRID" | "ONSITE";
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  experienceLevel: "ENTRY" | "MID" | "SENIOR" | "LEAD" | null;
  employmentType: string;
  department: string | null;
  postedAt: string | null;
  scrapedAt: string;
  applyUrl: string;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    industry: string | null;
    website: string | null;
  };
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return "";
  const curr = currency || "USD";
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CAD: "C$", AUD: "A$", SGD: "S$",
  };
  const sym = symbols[curr] || curr + " ";

  const format = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };

  if (min && max && min !== max) {
    return `${sym}${format(min)} – ${sym}${format(max)}`;
  }
  return `${sym}${format(min || max!)}`;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

export default function JobCard({ job, index = 0 }: { job: Job; index?: number }) {
  const remote = REMOTE_CONFIG[job.remoteType];
  const level = job.experienceLevel ? LEVEL_CONFIG[job.experienceLevel] : null;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const timeStr = timeAgo(job.scrapedAt);

  // Generate a placeholder gradient for missing logos
  const gradients = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #3b82f6, #06b6d4)",
    "linear-gradient(135deg, #f43f5e, #ec4899)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
  ];
  const gradientIndex = job.company.name.charCodeAt(0) % gradients.length;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="glass-card p-5 cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden"
            style={{
              background: job.company.logoUrl ? "var(--bg-secondary)" : gradients[gradientIndex],
            }}
          >
            {job.company.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.textContent = job.company.name[0];
                }}
              />
            ) : (
              job.company.name[0]
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base group-hover:text-[var(--accent-secondary)] transition-colors leading-tight">
                  {job.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {job.company.name}
                  {job.company.industry && (
                    <span style={{ color: "var(--text-muted)" }}> · {job.company.industry}</span>
                  )}
                </p>
              </div>
              <span
                className="text-xs flex-shrink-0 mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {timeStr}
              </span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`badge ${remote.class}`}>
                {remote.icon} {remote.label}
              </span>

              {level && (
                <span className={`badge ${level.class}`}>{level.label}</span>
              )}

              {job.department && (
                <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                  {job.department}
                </span>
              )}

              {job.location && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  📍 {job.city || job.location}{job.country ? `, ${job.country}` : ""}
                </span>
              )}
            </div>

            {/* Salary + Employment type */}
            <div className="flex items-center gap-3 mt-3">
              {salary && (
                <span className="salary-text text-sm">{salary}</span>
              )}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {job.employmentType.replace("_", "-").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
              </span>
            </div>

            {/* Description preview */}
            {job.description && (
              <p
                className="text-xs mt-2 line-clamp-2 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {job.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
