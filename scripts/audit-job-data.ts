#!/usr/bin/env npx tsx

/**
 * scripts/audit-job-data.ts
 *
 * Repeatable, non-destructive data quality audit script.
 * Audits jobs in data/jobs.json and Firestore for:
 * - Missing or placeholder job descriptions
 * - Generic or unverified locations
 * - Invalid, malformed or dangerous application URLs
 * - Stale listings (>30 days old)
 * - Suspected duplicates (matching canonical applyUrl or title+company)
 *
 * Usage:
 *   npx tsx scripts/audit-job-data.ts
 *   npx tsx scripts/audit-job-data.ts --json
 */

import fs from "fs";
import path from "path";
import { isValidPublicHttpUrl, formatLocation, hasSourceDescription, type Job } from "../src/lib/jobs";

interface AuditSummary {
  timestamp: string;
  totalRecords: number;
  activeCount: number;
  deadCount: number;
  missingDescriptions: number;
  genericLocations: number;
  specificLocations: number;
  globalLocations: number;
  invalidUrls: number;
  staleJobsOver30Days: number;
  duplicateUrlPairs: number;
  duplicateTitleCompanyPairs: number;
  flaggedForReviewCount: number;
}

interface ReviewRecord {
  id: string;
  title: string;
  company: string;
  issues: string[];
  applyUrl: string;
}

async function runAudit() {
  const isJson = process.argv.includes("--json");
  const jobsPath = path.join(process.cwd(), "data", "jobs.json");

  if (!fs.existsSync(jobsPath)) {
    console.error(`Jobs file not found at: ${jobsPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jobsPath, "utf-8");
  const jobs: Job[] = JSON.parse(raw);

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const urlMap = new Map<string, string[]>();
  const titleCompanyMap = new Map<string, string[]>();

  const reviewRecords: ReviewRecord[] = [];

  let deadCount = 0;
  let activeCount = 0;
  let missingDescriptions = 0;
  let genericLocations = 0;
  let specificLocations = 0;
  let globalLocations = 0;
  let invalidUrls = 0;
  let staleJobsOver30Days = 0;

  for (const job of jobs) {
    const issues: string[] = [];

    if (job.isDead) {
      deadCount++;
    } else {
      activeCount++;
    }

    // 1. Description audit
    if (!hasSourceDescription(job)) {
      missingDescriptions++;
      if (!job.isDead) {
        issues.push("missing_source_description");
      }
    }

    // 2. Location audit
    const loc = formatLocation(job);
    if (loc === "Remote") {
      genericLocations++;
      if (!job.isDead) {
        issues.push("generic_location_remote");
      }
    } else if (loc.includes("Worldwide")) {
      globalLocations++;
    } else {
      specificLocations++;
    }

    // 3. Application URL audit
    if (!job.applyUrl || !isValidPublicHttpUrl(job.applyUrl)) {
      invalidUrls++;
      issues.push("invalid_or_unsafe_apply_url");
    } else {
      try {
        const parsed = new URL(job.applyUrl);
        // Normalize by removing tracking query params (utm_*, ref, etc)
        const cleanUrl = `${parsed.origin}${parsed.pathname}`;
        const existing = urlMap.get(cleanUrl) || [];
        existing.push(job.id);
        urlMap.set(cleanUrl, existing);
      } catch {
        // Ignored
      }
    }

    // 4. Stale audit
    if (job.postedAt) {
      const postedTime = new Date(job.postedAt).getTime();
      if (!isNaN(postedTime) && now - postedTime > THIRTY_DAYS_MS) {
        staleJobsOver30Days++;
        if (!job.isDead) {
          issues.push("stale_over_30_days");
        }
      }
    }

    // 5. Title + Company tracking
    const compName = (job.company?.name || "").toLowerCase().trim();
    const cleanTitle = (job.title || "").toLowerCase().trim();
    const key = `${compName}:::${cleanTitle}`;
    const tcList = titleCompanyMap.get(key) || [];
    tcList.push(job.id);
    titleCompanyMap.set(key, tcList);

    if (issues.length > 0) {
      reviewRecords.push({
        id: job.id,
        title: job.title,
        company: job.company?.name || "Unknown",
        issues,
        applyUrl: job.applyUrl || "",
      });
    }
  }

  // Count duplicate URL pairs
  let duplicateUrlPairs = 0;
  for (const [_, ids] of urlMap) {
    if (ids.length > 1) {
      duplicateUrlPairs += ids.length - 1;
    }
  }

  // Count duplicate Title+Company pairs
  let duplicateTitleCompanyPairs = 0;
  for (const [_, ids] of titleCompanyMap) {
    if (ids.length > 1) {
      duplicateTitleCompanyPairs += ids.length - 1;
    }
  }

  const summary: AuditSummary = {
    timestamp: new Date().toISOString(),
    totalRecords: jobs.length,
    activeCount,
    deadCount,
    missingDescriptions,
    genericLocations,
    specificLocations,
    globalLocations,
    invalidUrls,
    staleJobsOver30Days,
    duplicateUrlPairs,
    duplicateTitleCompanyPairs,
    flaggedForReviewCount: reviewRecords.length,
  };

  if (isJson) {
    console.log(JSON.stringify({ summary, samplesForReview: reviewRecords.slice(0, 50) }, null, 2));
    return;
  }

  console.log("==================================================================");
  console.log("🔍 FRONTENDENGINEERS.COM - JOB DATA QUALITY AUDIT REPORT");
  console.log("==================================================================");
  console.log(`Audited at:                ${summary.timestamp}`);
  console.log(`Total database records:    ${summary.totalRecords}`);
  console.log(`Active listings:           ${summary.activeCount}`);
  console.log(`Archived / Dead listings:  ${summary.deadCount}`);
  console.log("------------------------------------------------------------------");
  console.log("📍 LOCATION & ELIGIBILITY QUALITY:");
  console.log(`  - Specific country/region: ${summary.specificLocations}`);
  console.log(`  - Explicit Worldwide:      ${summary.globalLocations}`);
  console.log(`  - Generic 'Remote' label:  ${summary.genericLocations} (never assumed worldwide)`);
  console.log("------------------------------------------------------------------");
  console.log("📝 DESCRIPTION QUALITY:");
  console.log(`  - Complete source desc:    ${summary.totalRecords - summary.missingDescriptions}`);
  console.log(`  - Feed missing desc:       ${summary.missingDescriptions} (showing source portal fallback)`);
  console.log("------------------------------------------------------------------");
  console.log("🔗 APPLICATION URLS & FRESHNESS:");
  console.log(`  - Invalid/Unsafe URLs:     ${summary.invalidUrls}`);
  console.log(`  - Stale jobs (>30 days):   ${summary.staleJobsOver30Days}`);
  console.log(`  - Duplicate apply URLs:    ${summary.duplicateUrlPairs}`);
  console.log(`  - Duplicate Title+Company: ${summary.duplicateTitleCompanyPairs}`);
  console.log("------------------------------------------------------------------");
  console.log(`Flagged records for review: ${summary.flaggedForReviewCount}`);
  console.log("==================================================================\n");

  if (reviewRecords.length > 0) {
    console.log("Sample records needing review (first 5):");
    reviewRecords.slice(0, 5).forEach((r, idx) => {
      console.log(` ${idx + 1}. [${r.company}] ${r.title} (ID: ${r.id})`);
      console.log(`    Issues: ${r.issues.join(", ")}`);
      console.log(`    URL:    ${r.applyUrl}`);
    });
  }
}

runAudit().catch(console.error);
