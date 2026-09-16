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
function normalizeTitle(title: string): string {
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


