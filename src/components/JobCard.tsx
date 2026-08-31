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

// ─── Tech Stack Extraction ──────────────────────────────

const TECH_KEYWORDS = [
  "React", "Vue", "Angular", "TypeScript", "JavaScript",
  "Next.js", "Node.js", "Svelte", "Remix", "GraphQL",
  "Tailwind", "CSS", "HTML", "Redux", "Python",
  "AWS", "Docker", "Kubernetes", "Go", "Rust",
  "Swift", "Flutter", "React Native",
];

function extractTechStack(title: string, description: string | null): string[] {
  const text = `${title} ${(description || "").substring(0, 500)}`;
  const found: string[] = [];
  for (const keyword of TECH_KEYWORDS) {
    // Word-boundary aware match (case insensitive)
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(text)) {
      found.push(keyword);
    }
    if (found.length >= 4) break; // Cap at 4 tags to avoid clutter
  }
  return found;
}

import { useAuth } from "@/context/AuthContext";

// ─── Component ───────────────────────────────────────────

interface JobCardProps {
  job: Job;
  index?: number;
}

export default function JobCard({
  job,
  index = 0,
}: JobCardProps) {
  const { isSubscribed } = useAuth();
  
  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;
  const level = job.experienceLevel
    ? LEVEL_CONFIG[job.experienceLevel]
    : null;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_GRADIENTS.length;
  const techStack = extractTechStack(job.title, job.description);
  const postedDate = timeAgo(job.postedAt);

  // Always use the internal href so users can see the job details page
  const slug = job.slug || job.id;
  const internalHref = `/jobs/${slug}`;

  const cardContent = (
    <article
      className="glass-card h-full p-4 sm:p-5 cursor-pointer group hover:bg-[#111] transition-all flex flex-col"
    >
      <div className="flex items-start gap-3 sm:gap-4 flex-1">
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
              width={48}
              height={48}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "true";
                  // Extract domain from website or logoUrl
                  let domain = "google.com"; // default fallback domain just in case
                  if (job.company?.website) {
                    try {
                      domain = new URL(job.company.website).hostname;
                    } catch (e) {}
                  } else if (job.company?.logoUrl && job.company.logoUrl.includes("clearbit.com/")) {
                    domain = job.company.logoUrl.split("clearbit.com/")[1];
                  }
                  img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                } else {
                  img.style.display = "none";
                  img.parentElement!.textContent =
                    (job.company?.name || "?")[0];
                }
              }}
            />
          ) : (
            (job.company?.name || "?")[0]
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] sm:text-base group-hover:text-[var(--accent-secondary)] transition-colors leading-tight line-clamp-2">
                {job.title}
              </h3>
              <p
                className="text-sm mt-1 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {job.company?.name || "Company"}
                {job.company?.industry && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {" "}
                    · {job.company.industry}
                  </span>
                )}
              </p>
            </div>
            {/* Posted date */}
            <span
              className="text-xs whitespace-nowrap flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {postedDate}
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

            {!isSubscribed ? (
              <span
                className="locked-field text-xs"
                style={{ color: "var(--text-muted)" }}
                aria-label="Location locked"
              >
                📍 New York, US
              </span>
            ) : job.location ? (
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                📍{" "}
                {job.city || job.location}
                {job.country ? `, ${job.country}` : ""}
              </span>
            ) : null}
          </div>

          {/* Tech stack tags */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {techStack.map((tech) => (
                <span key={tech} className="tech-tag">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Salary + Employment type */}
          <div className="flex items-center gap-3 mt-2.5 sm:mt-3">
            {!isSubscribed ? (
              <div className="flex items-center gap-2">
                <span
                  className="locked-field salary-text text-sm"
                  role="img"
                  aria-label="Salary range — locked, unlock with Pro membership"
                >
                  $120K – $180K
                </span>
                <span className="locked-overlay">
                  🔒 Unlock with Pro
                </span>
              </div>
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
            !isSubscribed ? (
              <div className="flex items-center gap-2 mt-auto pt-2">
                <p
                  className="locked-field text-xs line-clamp-2 leading-relaxed flex-1"
                  style={{ color: "var(--text-muted)" }}
                  role="img"
                  aria-label="Job description — locked, unlock with Pro membership"
                >
                  {job.description.substring(0, 150)}
                </p>
                <span className="locked-overlay flex-shrink-0">
                  🔒 Unlock
                </span>
              </div>
            ) : (
              <p
                className="text-xs mt-auto pt-2 line-clamp-2 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {job.description}
              </p>
            )
          )}
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={internalHref}
      className="block h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {cardContent}
    </Link>
  );
}
