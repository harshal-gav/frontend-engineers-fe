// ─── Shared Job Types & Utilities ─────────────────────────

export interface JobCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  remoteType: "REMOTE" | "HYBRID" | "ONSITE";
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  experienceLevel: "ENTRY" | "MID" | "SENIOR" | "LEAD" | null;
  employmentType: string;
  department: string | null;
  postedAt: string | null;
  sourceHash: string;
  applyUrl: string;
  company: JobCompany;
  // Added by dead-job detection (Feature 6)
  isDead?: boolean;
  deadAt?: string | null;
  // Computed at read time
  slug?: string;
}

/**
 * Teaser version of a job — fields that free users can see.
 * Premium-gated fields (company name, applyUrl, salary) are stripped/masked.
 */
export interface TeaserJob {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  remoteType: "REMOTE" | "HYBRID" | "ONSITE";
  experienceLevel: "ENTRY" | "MID" | "SENIOR" | "LEAD" | null;
  employmentType: string;
  slug: string;
  // Masked fields
  company: { name: string };
  applyUrl: null;
  salaryMin: null;
  salaryMax: null;
  currency: null;
}

/**
 * Generate a URL-friendly slug from a job's title and company name.
 * Format: "senior-react-engineer-at-discord-4665b917"
 *         (title-at-company-first8charsOfId)
 */
export function generateSlug(job: Job): string {
  const titlePart = job.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60)
    .replace(/-$/, "");

  const companyPart = (job.company?.name || "company")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 20)
    .replace(/-$/, "");

  const idSuffix = job.id.substring(0, 8);

  return `${titlePart}-at-${companyPart}-${idSuffix}`;
}

/**
 * Format salary range for display.
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  if (!min && !max) return "";
  const curr = currency || "USD";
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    SGD: "S$",
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

/**
 * Human-friendly relative time string.
 */
export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";

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


/**
 * Mask a job for non-premium users.
 * Strips company name, apply URL, and salary data.
 */
export function maskJobForTeaser(job: Job): TeaserJob {
  return {
    id: job.id,
    title: job.title,
    description: job.description
      ? job.description.substring(0, 120) + "..."
      : "Subscribe to Premium to see full job details.",
    location: job.location,
    remoteType: job.remoteType,
    experienceLevel: job.experienceLevel,
    employmentType: job.employmentType,
    slug: job.slug || generateSlug(job),
    company: { name: "Premium Company" },
    applyUrl: null,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  };
}
