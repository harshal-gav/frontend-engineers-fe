import fs from "fs";
import path from "path";
import { generateSlug, type Job } from "./jobs";

// Companies whose Clearbit logos are known to actually work (real domains)
const KNOWN_GOOD_LOGO_DOMAINS = new Set([
  "affirm.com", "binance.com", "bairesdev.com", "capgemini.com",
  "cedar.com", "citi.com", "clearstreet.io", "clickup.com",
  "cloudbeds.com", "coinbase.com", "deel.com", "epamsystems.com",
  "fever.com", "finn.com", "flix.com", "fujitsu.com",
  "github.com", "gitlab.com", "hubspot.com", "ibm.com",
  "infosys.com", "jedox.com", "kraken.com", "lingaro.com",
  "mastercard.com", "meta.com", "metlife.com", "motorolasolutions.com",
  "nagarro.com", "nearform.com", "nebius.com", "netflix.com",
  "ntt.com", "pandadoc.com", "pigment.com", "pleo.com",
  "ramp.com", "reddit.com", "redditinc.com", "relativity.com",
  "roofr.com", "searchapi.com", "sensortower.com", "sentinelone.com",
  "shopify.com", "spotify.com", "spreetail.com", "stedi.com",
  "stripe.com", "supabase.com", "tailscale.com", "teamworks.com",
  "telus.com", "telusdigital.com", "transunion.com", "trmlabs.com",
  "twilio.com", "vercel.com", "vultr.com", "wealthfront.com",
  "whatnot.com", "xsolla.com", "zendesk.com", "qad.com",
  "refokus.com", "dataannotation.com", "lumanu.com", "spocket.com",
  "planner5d.com", "hover.com", "mable.com", "hired.com",
  "oscilar.com", "evlo.ai", "mimica.com", "netomi.com",
  "devart.com", "softup.com", "doda.com", "intuitionmachines.com",
  "optimal-dynamics.com", "optimaldynamics.com",
  "trustpayments.com", "unifonic.com", "veradigm.com",
  "zebratechnologies.com", "zeller.com", "personifycare.com",
  "thedyrt.com", "surgeai.com", "stackai.com",
  "patrianna.com", "snoonu.com", "keymate.com",
  "getcedar.com", "nogood.com", "microsourcing.com",
]);

/**
 * Check if a Clearbit logo URL points to a real company logo (not a generic globe).
 */
export function hasRealLogo(logoUrl: string | null): boolean {
  if (!logoUrl) return false;
  const match = logoUrl.match(/logo\.clearbit\.com\/(.+)/);
  if (!match) return !!logoUrl; // Non-clearbit URL, assume valid
  const domain = match[1];
  return KNOWN_GOOD_LOGO_DOMAINS.has(domain);
}

/**
 * Normalize a job title for deduplication.
 * Strips REF numbers, campaign IDs, language variants, etc.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[-|]\s*remote\s*(work)?/gi, "")
    .replace(/\s*[-|]\s*trabajo\s*remoto/gi, "")
    .replace(/\s*[-|]\s*work\s*from\s*home/gi, "")
    .replace(/\s*\|\s*ref#?\d+/gi, "")
    .replace(/\s*ref#?\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Space out jobs so no single company appears within `spacing` positions of itself.
 */
function spaceOutCompanies(jobsArr: Job[], spacing: number): Job[] {
  const spacedJobs: Job[] = [];
  const remaining = [...jobsArr];
  const companyLastSeen = new Map<string, number>();

  while (remaining.length > 0) {
    let selectedIdx = -1;

    for (let i = 0; i < remaining.length; i++) {
      const company = remaining[i].company?.name || "";
      const lastSeenIdx = companyLastSeen.get(company);

      if (
        lastSeenIdx === undefined ||
        spacedJobs.length - lastSeenIdx > spacing
      ) {
        selectedIdx = i;
        break;
      }
    }

    // If we couldn't find one that satisfies the spacing, take the first available
    if (selectedIdx === -1) selectedIdx = 0;

    const selectedJob = remaining.splice(selectedIdx, 1)[0];
    spacedJobs.push(selectedJob);
    companyLastSeen.set(selectedJob.company?.name || "", spacedJobs.length - 1);
  }

  return spacedJobs;
}

const CONSULTANCY_NAMES = new Set([
  "bairesdev", "yo it consulting", "sme careers", "quik hire staffing",
  "hire feed", "frontline data solutions", "piper companies",
  "alignerr", "plan a technologies", "grupo digital", "corecruit (formerly quil)",
  "lateral group", "lateral benelux", "kreitech", "in all media",
  "sourcingxpress", "recruitgo careers", "recruitpoolz", "fetchjobs.co",
  "medinex workforce", "crossing infotech", "argo intern",
  "sirsonite solutions pvt. ltd.", "eitacies inc.", "hired",
  "accenture in india", "accenture dach", "sophilabs",
  "micromart", "microsourcing", "helios & partners",
  "thinkscoop technologies", "monatta solutions", "data8x",
  "stack provider", "techblocks", "overt minds",
  "partner engineering test company", "deel middleware test company",
  "best job tool", "secret sauce partners",
  "yatiraj technologies private limited",
  "zyple software solutions pvt ltd | sap business one partner",
  "integrated software data services", "hirrobase",
  "afterquery experts", "athenaprep", "athenax",
  "walia nexus", "airitos, llc",
]);

// Check if a company name matches a consultancy
export function isConsultancy(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (CONSULTANCY_NAMES.has(lower)) return true;
  // Also catch generic patterns
  if (/\b(staffing|recruit|consult|outsourc|placement|hire\b)/i.test(lower)) return true;
  return false;
}

export function isTopTierJob(job: Job): boolean {
  const companyName = job.company?.name || "";
  const realLogo = hasRealLogo(job.company?.logoUrl || null);
  return realLogo && !isConsultancy(companyName);
}

/**
 * Read and parse jobs.json from the data directory.
 * Filters to remote + frontend-relevant jobs, enriches with slug, excludes dead jobs.
 * Deduplicates, pushes no-logo jobs to bottom, and spaces out same-company listings.
 * This is a server-side only function.
 */
export function loadJobsFromFile(): Job[] {
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  if (!fs.existsSync(jobsPath)) return [];

  const raw = fs.readFileSync(jobsPath, "utf-8");
  const rawJobs: Job[] = JSON.parse(raw);

  // Include all jobs, enrich with slug
  const validJobs = rawJobs
    .map((job) => ({
      ...job,
      slug: generateSlug(job),
      isCareerUrl: (job.applyUrl || "").toLowerCase().includes("career"),
    }));

  // Sort: Jobs with logos first, then frontend titles, then by date, dead jobs at the end
  validJobs.sort((a, b) => {
    // Dead jobs go to the bottom
    if (a.isDead && !b.isDead) return 1;
    if (!a.isDead && b.isDead) return -1;

    const aHasLogo = !!a.company?.logoUrl;
    const bHasLogo = !!b.company?.logoUrl;

    if (aHasLogo && !bHasLogo) return -1;
    if (!aHasLogo && bHasLogo) return 1;

    const aFrontend = a.title.toLowerCase().includes("frontend");
    const bFrontend = b.title.toLowerCase().includes("frontend");
    
    if (aFrontend && !bFrontend) return -1;
    if (!aFrontend && bFrontend) return 1;
    
    return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
  });

  const careerTier: Job[] = [];
  const otherTier: Job[] = [];

  for (const job of validJobs) {
    if (job.isCareerUrl) {
      careerTier.push(job);
    } else {
      otherTier.push(job);
    }
  }

  const spacedCareer = spaceOutCompanies(careerTier, 6);
  const spacedOther = spaceOutCompanies(otherTier, 6);

  const finalJobs = spaceOutCompanies([...spacedCareer, ...spacedOther], 6);
  
  return finalJobs;
}

/**
 * Deduplicate jobs array based on:
 * 1. Canonical applyUrl (stripping query tracking strings)
 * 2. Company name + Normalized Title + Country
 * Always preserves the newest record by posted date.
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  // Sort newest first so the most recent listing is kept
  const sorted = [...jobs].sort((a, b) => {
    const timeA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const timeB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return timeB - timeA;
  });

  const seenUrls = new Set<string>();
  const seenTitleCompany = new Set<string>();
  const deduplicated: Job[] = [];

  for (const job of sorted) {
    let cleanUrl = "";
    if (job.applyUrl) {
      try {
        const u = new URL(job.applyUrl.trim());
        cleanUrl = `${u.origin}${u.pathname.toLowerCase()}`;
      } catch {
        cleanUrl = job.applyUrl.trim().toLowerCase();
      }
    }

    if (cleanUrl && seenUrls.has(cleanUrl)) {
      continue;
    }

    const company = (job.company?.name || "").toLowerCase().trim();
    const title = normalizeTitle(job.title || "");
    const country = (job.country || "").toLowerCase().trim();
    const tcKey = `${company}:::${title}:::${country}`;

    if (company && title && seenTitleCompany.has(tcKey)) {
      continue;
    }

    if (cleanUrl) seenUrls.add(cleanUrl);
    if (company && title) seenTitleCompany.add(tcKey);
    deduplicated.push(job);
  }

  return deduplicated;
}

/**
 * Filter to active, eligible jobs:
 * - Excludes dead jobs (isDead === true)
 * - Excludes unpublished/draft/empty jobs (must have title, company name, applyUrl)
 * - Deduplicates duplicates
 */
export function filterActiveJobs(jobs: Job[]): Job[] {
  const eligible = jobs.filter((job) => {
    if (job.isDead) return false;
    if (!job.title || !job.company?.name || !job.applyUrl) return false;
    return true;
  });

  return deduplicateJobs(eligible);
}

/**
 * Single source of truth for active job inventory across the entire application.
 * Loads jobs from local store and optionally merges active employer jobs from Firestore.
 */
export async function getActiveJobs(options: { includeFirestore?: boolean } = { includeFirestore: true }): Promise<Job[]> {
  const fileJobs = loadJobsFromFile();
  let allJobs = [...fileJobs];

  if (options.includeFirestore) {
    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const db = getAdminDb();
      const firestoreJobsSnapshot = await db.collection("jobs").orderBy("postedAt", "desc").get();
      const firestoreJobs: Job[] = [];
      firestoreJobsSnapshot.forEach((doc) => {
        const data = doc.data() as Job;
        if (data.postedAt && (data.postedAt as any).toDate) {
          data.postedAt = (data.postedAt as any).toDate().toISOString();
        }
        firestoreJobs.push(data);
      });
      allJobs = [...firestoreJobs, ...allJobs];
    } catch {
      // In offline, test, or build environments without Firebase credentials, fallback gracefully to fileJobs
    }
  }

  return filterActiveJobs(allJobs);
}

/**
 * Single source of truth for all job inventory statistics across the website.
 */
export async function getJobInventoryStats(options: { includeFirestore?: boolean } = { includeFirestore: true }) {
  const activeJobs = await getActiveJobs(options);
  const uniqueCompanies = new Set(
    activeJobs.map((j) => (j.company?.name || "").trim().toLowerCase()).filter(Boolean)
  );

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const freshJobs = activeJobs.filter(
    (j) => j.postedAt && new Date(j.postedAt).getTime() > sevenDaysAgo
  );

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const newToday = activeJobs.filter(
    (j) => j.postedAt && new Date(j.postedAt).getTime() > oneDayAgo
  );

  return {
    jobCount: activeJobs.length,
    companyCount: uniqueCompanies.size,
    freshJobCount: freshJobs.length,
    newTodayCount: newToday.length,
  };
}


