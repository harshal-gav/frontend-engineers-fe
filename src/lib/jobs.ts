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
  isCareerUrl?: boolean;
  isFree?: boolean;
  /** True if this job was posted within the early-access window (7 days) */
  isEarlyAccess?: boolean;
}

/**
 * Teaser version of a job — fields that free users can see.
 * The applyUrl and salary fields are securely masked on the server so they cannot be inspected in the network tab.
 */
export type TeaserJob = Omit<Job, "applyUrl" | "salaryMin" | "salaryMax" | "currency" | "location" | "city" | "country" | "state"> & {
  applyUrl: null;
  salaryMin: null;
  salaryMax: null;
  currency: null;
  location: null;
  city: null;
  country: null;
  state: null;
};

// ... slug generation and format methods ...
export function generateSlug(job: Job): string {
  const fillerWords = /\b(the|and|in|a|an|of|for|with)\b/gi;
  const titlePart = job.title
    .toLowerCase()
    .replace(fillerWords, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60)
    .replace(/-+$/, "");

  const companyPart = (job.company?.name || "company")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 20)
    .replace(/-+$/, "");

  const idSuffix = job.id.substring(0, 8);

  return `${titlePart}-at-${companyPart}-${idSuffix}`;
}

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
 * Securely strips the apply URL and salary data on the backend.
 * Truncates the description to 300 characters so hackers cannot scrape full descriptions,
 * while leaving enough text for basic client-side search to function.
 */
export function maskJobForTeaser(job: Job): TeaserJob {
  return {
    ...job,
    description: job.description
      ? job.description.substring(0, 300) + (job.description.length > 300 ? "..." : "")
      : null,
    applyUrl: null,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    location: null,
    city: null,
    country: null,
    state: null,
  };
}
