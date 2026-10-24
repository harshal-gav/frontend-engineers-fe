// ─── Shared Job Types & Utilities ─────────────────────────

export interface JobCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
}

export interface AiTags {
  stack: string[];
  remoteScope: 'GLOBAL' | 'REGION' | 'COUNTRY';
  eligibleRegions: string[];
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'manager';
  employmentType: 'fulltime' | 'contract' | 'parttime' | 'b2b' | 'internship';
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  country: string | null;
  remoteType: "REMOTE" | "HYBRID" | "ONSITE";
  postedAt: string | null;
  sourceHash: string;
  applyUrl: string;
  company: JobCompany;
  // AI-extracted structured tags for advanced filtering
  aiTags?: AiTags;
  // Added by dead-job detection (Feature 6)
  isDead?: boolean;
  deadAt?: string | null;
  // Computed at read time
  slug?: string;
  isCareerUrl?: boolean;
  isFree?: boolean;
  hasSalaryHidden?: boolean;
  /** True if this job's details are locked (free users see title only) */
  isLocked?: boolean;
}

/**
 * Teaser version of a job - fields that free users can see.
 * The applyUrl and salary fields are securely masked on the server so they cannot be inspected in the network tab.
 */
export type TeaserJob = Omit<Job, "applyUrl" | "location" | "country"> & {
  applyUrl: null;
  location: null;
  country: null;
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

export function maskJobForTeaser(job: Job): TeaserJob {
  return {
    ...job,
    description: job.description
      ? job.description.substring(0, 300) + (job.description.length > 300 ? "..." : "")
      : null,
    applyUrl: null,
    location: null,
    country: null,
  };
}

/**
 * Check if the job has a real source description from the employer.
 */
export function hasSourceDescription(job: Job): boolean {
  return Boolean(job.description && job.description.trim().length > 30);
}

/**
 * Return an informative description for structured data and crawlers.
 * NEVER fabricates false requirements or bullet points.
 */
export function getEffectiveJobDescription(job: Job): string {
  if (hasSourceDescription(job)) {
    return job.description!.trim();
  }
  const company = job.company?.name || "Company";
  return `Remote ${job.title} position at ${company}. Full job description, requirements, and application instructions are available directly on the official company careers page.`;
}

/**
 * Format the job location accurately based on verified source evidence.
 * NEVER infers 'Worldwide' without explicit global evidence.
 */
export function formatLocation(job: Job): string {
  // If specific country is present and not a generic placeholder
  const rawCountry = (job.country || "").trim();
  const lowerCountry = rawCountry.toLowerCase();

  const isGenericGlobal =
    lowerCountry === "global" ||
    lowerCountry === "worldwide" ||
    lowerCountry === "anywhere";

  if (rawCountry && !isGenericGlobal) {
    return rawCountry;
  }

  // Check specific location string
  const rawLoc = (job.location || "").trim();
  if (rawLoc.toLowerCase().startsWith("remote - ")) {
    const locPart = rawLoc.substring(9).trim();
    if (locPart && locPart.toLowerCase() !== "global" && locPart.toLowerCase() !== "anywhere") {
      return locPart;
    }
  } else if (rawLoc && rawLoc.toLowerCase() !== "remote" && !isGenericGlobal) {
    return rawLoc;
  }

  // Check structured AI tags if verified
  if (job.aiTags?.remoteScope === "GLOBAL" || (job.aiTags?.eligibleRegions && job.aiTags.eligibleRegions.includes("Global"))) {
    return "Worldwide (Remote)";
  }

  if (job.aiTags?.eligibleRegions && job.aiTags.eligibleRegions.length > 0 && job.aiTags.eligibleRegions[0] !== "Global") {
    return `${job.aiTags.eligibleRegions.join(", ")} (Remote)`;
  }

  // When no specific country or global evidence exists, be honest
  return "Remote";
}

/**
 * Validate that an external URL is a safe public HTTP or HTTPS destination.
 * Prevents Server-Side Request Forgery (SSRF) against internal services, localhost, or cloud metadata.
 */
export function isValidPublicHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Block local, loopback, link-local, and cloud metadata endpoints
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" || // AWS / GCP / Azure metadata
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost") ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^127\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}



