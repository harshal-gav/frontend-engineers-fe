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
export function loadJobsFromFile(options?: { includeDead?: boolean }): Job[] {
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");
  if (!fs.existsSync(jobsPath)) return [];

  const raw = fs.readFileSync(jobsPath, "utf-8");
  const rawJobs: Job[] = JSON.parse(raw);

  // 1. Filter + aggressive deduplication using normalized titles
  const seenDuplicates = new Set<string>();
  const validJobs = rawJobs
    .filter((job) => {
      if (job.isDead && !options?.includeDead) return false;

      const isRemote =
        job.remoteType === "REMOTE" ||
        (job.location && /remote|anywhere/i.test(job.location));

      const isRelevant =
        /\b(frontend|front-end|react|vue|angular|ui|ux|web|software|engineer|developer)\b/i.test(
          job.title
        ) ||
        (job.description &&
          /\b(frontend|front-end|react|vue|angular|software)\b/i.test(
            job.description
          ));

      if (!isRemote || !isRelevant) return false;

      // Aggressive duplicate check: normalized title + company
      const normTitle = normalizeTitle(job.title);
      const companyName = (job.company?.name || "").toLowerCase().trim();
      const dupKey = `${normTitle}||${companyName}`;
      if (seenDuplicates.has(dupKey)) return false;
      seenDuplicates.add(dupKey);

      return true;
    })
    .map((job) => ({
      ...job,
      slug: generateSlug(job),
    }));

  // 2. Classify jobs into tiers: Product companies first, consultancies last
  // Tier 1: Legit product companies with real logos (front pages)
  // Tier 2: Other companies with real logos OR legit companies without logos (middle)
  // Tier 3: Consultancies / staffing agencies (last pages)
  const tier1: Job[] = [];
  const tier2: Job[] = [];
  const tier3: Job[] = [];

  for (const job of validJobs) {
    if (isTopTierJob(job)) {
      tier1.push(job);
    } else if (isConsultancy(job.company?.name || "")) {
      tier3.push(job);
    } else {
      tier2.push(job);
    }
  }

  // 3. Space out within each tier, then combine
  const spacedTier1 = spaceOutCompanies(tier1, 6);
  const spacedTier2 = spaceOutCompanies(tier2, 6);
  const spacedTier3 = spaceOutCompanies(tier3, 6);

  // 4. Final pass: space out the combined list to handle boundary overlaps
  return spaceOutCompanies([...spacedTier1, ...spacedTier2, ...spacedTier3], 6);
}

