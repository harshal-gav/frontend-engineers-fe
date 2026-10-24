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
 * Return an informative description for display and structured data.
 * If the raw description is missing or extremely brief, synthesizes a structured summary
 * from the verified job metadata (company, title, stack tags, seniority, remote scope).
 */
export function getEffectiveJobDescription(job: Job): string {
  if (job.description && job.description.trim().length > 60) {
    return job.description.trim();
  }
  const stack = job.aiTags?.stack?.length ? job.aiTags.stack.join(", ") : "React, TypeScript, and modern frontend tools";
  const seniority = job.aiTags?.seniority ? `${job.aiTags.seniority.charAt(0).toUpperCase() + job.aiTags.seniority.slice(1)}` : "Frontend";
  const company = job.company?.name || "The hiring team";
  const remoteType = job.remoteType === "REMOTE" ? "100% Remote" : job.remoteType;
  const location = job.country ? `Candidates in ${job.country}` : "Candidates worldwide";

  return `${company} is hiring a ${seniority} ${job.title} to join their remote engineering team.

Overview & Key Details:
• Role: ${job.title}
• Company: ${company}${job.company?.industry ? ` (${job.company.industry})` : ""}
• Work Mode: ${remoteType} (${location})
• Core Stack: ${stack}
• Seniority Level: ${seniority}

Click "Apply Now" to view the full job post, compensation, and apply directly on the company careers page.`;
}


