"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { timeAgo, type Job } from "@/lib/jobs";

// ─── Config ──────────────────────────────────────────────

const REMOTE_CONFIG = {
  REMOTE: { label: "Remote", class: "badge-remote", icon: "🌍" },
  HYBRID: { label: "Hybrid", class: "badge-hybrid", icon: "🏢" },
  ONSITE: { label: "On-site", class: "badge-onsite", icon: "📍" },
} as const;



const LOGO_COLORS = [
  "#3b4a6b",
  "#4a3b5c",
  "#3b5c4a",
  "#5c4a3b",
  "#3b5c5c",
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

// ─── Component ───────────────────────────────────────────

interface JobCardProps {
  job: Job;
  index?: number;
}

export default function JobCard({
  job,
  index = 0,
}: JobCardProps) {
  const searchParams = useSearchParams();
  const remote = REMOTE_CONFIG[job.remoteType] || REMOTE_CONFIG.REMOTE;

  let displayLocation = job.location || "";
  if (displayLocation.toLowerCase().startsWith("remote - ")) {
    displayLocation = displayLocation.substring(9);
  } else if (displayLocation.toLowerCase() === "remote") {
    displayLocation = "";
  }

  const gradientIndex =
    (job.company?.name || "X").charCodeAt(0) % LOGO_COLORS.length;
  const techStack = extractTechStack(job.title, job.description);
  const postedDate = timeAgo(job.postedAt);

  // Always use the internal href so users can see the job details page
  const slug = job.slug || job.id;
  const paramsString = searchParams?.toString();
  const internalHref = paramsString ? `/jobs/${slug}?${paramsString}` : `/jobs/${slug}`;

  const cardContent = (
    <article className="glass-card relative overflow-hidden bg-white p-5 sm:p-6 cursor-pointer group hover:border-[#2563eb]/40 hover:shadow-xl hover:shadow-[#2563eb]/5 transition-all duration-300 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start rounded-2xl h-full">
      {/* Company Logo */}
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm"
        style={{
          background: job.company?.logoUrl
            ? "#ffffff"
            : LOGO_COLORS[gradientIndex],
        }}
      >
        {job.company?.logoUrl ? (
          <img
            src={job.company.logoUrl}
            alt={job.company.name}
            className="w-full h-full object-contain p-2"
            width={64}
            height={64}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "true";
                let domain = "google.com";
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
                img.parentElement!.style.background = LOGO_COLORS[gradientIndex];
                img.parentElement!.style.color = "#ffffff";
              }
            }}
          />
        ) : (
          (job.company?.name || "?")[0]
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 w-full flex flex-col h-full">
        {/* Top Row: Title & Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-1.5">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="text-base sm:text-[1.1rem] font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors leading-snug line-clamp-2">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-1.5 text-sm font-medium text-gray-500 overflow-hidden whitespace-nowrap">
              <span className="text-gray-700 font-semibold truncate shrink-0 max-w-[60%]">{job.company?.name || "Company"}</span>
              
              {job.company?.industry && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                  <span className="truncate min-w-0">{job.company.industry}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end sm:gap-1.5">
            {job.isEarlyAccess && (
              <span className="text-[10px] font-extrabold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                Pro Access
              </span>
            )}
            <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
              {postedDate}
            </span>
          </div>
        </div>

        {/* Description Preview */}
        {job.description && (
          <p className="text-[13px] sm:text-sm text-gray-500 line-clamp-2 mt-2 mb-4 leading-relaxed pr-2">
            {job.description}
          </p>
        )}

        {/* Bottom Tags & Action */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full">
            <span className={`badge ${remote.class} px-2.5 py-1 text-[11px] font-bold rounded-md shadow-sm flex items-center gap-1 w-full sm:w-auto`}>
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span className="whitespace-normal text-left">
                {remote.label}
                {displayLocation ? ` • ${displayLocation}` : ""}
                {job.country && !displayLocation.includes(job.country) ? `, ${job.country}` : ""}
              </span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <Link
      href={internalHref}
      prefetch={false}
      className="block h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {cardContent}
    </Link>
  );
}
