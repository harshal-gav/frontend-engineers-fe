#!/usr/bin/env npx tsx

/**
 * check-dead-jobs.ts — Cron-safe dead job detection script
 *
 * Reads data/jobs.json, HEAD-requests each job's applyUrl,
 * and marks jobs as "dead" if the URL returns 404/410/gone.
 *
 * Usage:
 *   npx tsx scripts/check-dead-jobs.ts
 *   npx tsx scripts/check-dead-jobs.ts --dry-run    (preview only, don't write)
 *   npx tsx scripts/check-dead-jobs.ts --concurrency 5
 *
 * Designed to be safe for cron:
 * - Idempotent: running multiple times is safe
 * - Rate-limited: default 3 concurrent requests to avoid IP bans
 * - Logs results to stdout for Vercel/cron log capture
 * - Preserves existing isDead markers (won't un-mark previously dead jobs)
 * - Writes atomically (temp file + rename)
 */

import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  applyUrl: string;
  isDead?: boolean;
  deadAt?: string | null;
  company?: { name: string };
  [key: string]: any;
}

interface CheckResult {
  id: string;
  title: string;
  company: string;
  applyUrl: string;
  status: number | "error";
  isDead: boolean;
  reason: string;
}

// ─── Config ──────────────────────────────────────────────

const JOBS_PATH = path.join(process.cwd(), "data", "jobs.json");
const DEAD_STATUS_CODES = [404, 410, 403]; // 403 often means the listing was removed
const TIMEOUT_MS = 10_000; // 10 seconds per request
const isDryRun = process.argv.includes("--dry-run");

const concurrencyFlag = process.argv.indexOf("--concurrency");
const CONCURRENCY =
  concurrencyFlag !== -1 ? parseInt(process.argv[concurrencyFlag + 1]) || 3 : 3;

// ─── Helpers ─────────────────────────────────────────────

async function checkUrl(
  url: string
): Promise<{ status: number | "error"; isDead: boolean; reason: string }> {
  if (!url || url.trim() === "") {
    return { status: "error", isDead: false, reason: "empty_url" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "FrontendEngineers-JobChecker/1.0 (https://frontendengineers.com)",
      },
    });

    clearTimeout(timeout);

    if (DEAD_STATUS_CODES.includes(response.status)) {
      return {
        status: response.status,
        isDead: true,
        reason: `http_${response.status}`,
      };
    }

    return { status: response.status, isDead: false, reason: "alive" };
  } catch (error: any) {
    // Network errors, DNS failures, etc. — don't mark as dead
    // (could be temporary, or our IP might be blocked)
    const reason =
      error.name === "AbortError"
        ? "timeout"
        : error.code || "network_error";
    return { status: "error", isDead: false, reason };
  }
}

/**
 * Process jobs in batches with limited concurrency.
 */
async function processInBatches(
  jobs: Job[],
  concurrency: number
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const queue = [...jobs];
  let processed = 0;

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift()!;
      processed++;

      // Skip already-dead jobs
      if (job.isDead) {
        results.push({
          id: job.id,
          title: job.title,
          company: job.company?.name || "Unknown",
          applyUrl: job.applyUrl,
          status: "error",
          isDead: true,
          reason: "already_dead",
        });
        continue;
      }

      const result = await checkUrl(job.applyUrl);
      results.push({
        id: job.id,
        title: job.title,
        company: job.company?.name || "Unknown",
        applyUrl: job.applyUrl,
        ...result,
      });

      if (processed % 10 === 0) {
        console.log(
          `  [Progress] ${processed}/${jobs.length} checked...`
        );
      }
    }
  }

  // Launch concurrent workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  🔍 Dead Job Detection Script");
  console.log(`  📁 Source: ${JOBS_PATH}`);
  console.log(`  ⚙️  Concurrency: ${CONCURRENCY}`);
  console.log(`  ${isDryRun ? "🧪 DRY RUN (no writes)" : "✏️  LIVE (will write changes)"}`);
  console.log("═══════════════════════════════════════════════\n");

  if (!fs.existsSync(JOBS_PATH)) {
    console.error("❌ jobs.json not found at", JOBS_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(JOBS_PATH, "utf-8");
  const jobs: Job[] = JSON.parse(raw);
  console.log(`📋 Total jobs in file: ${jobs.length}\n`);

  // Only check jobs that have a URL and aren't already marked dead
  const jobsToCheck = jobs.filter((j) => j.applyUrl && !j.isDead);
  const alreadyDead = jobs.filter((j) => j.isDead).length;
  console.log(
    `  🔗 Jobs to check: ${jobsToCheck.length} (${alreadyDead} already dead)\n`
  );

  const results = await processInBatches(jobsToCheck, CONCURRENCY);

  // Compute stats
  const newlyDead = results.filter(
    (r) => r.isDead && r.reason !== "already_dead"
  );
  const alive = results.filter((r) => !r.isDead);
  const errors = results.filter(
    (r) => r.status === "error" && r.reason !== "already_dead"
  );

  console.log("\n── Results ─────────────────────────────────");
  console.log(`  ✅ Alive: ${alive.length}`);
  console.log(`  💀 Newly dead: ${newlyDead.length}`);
  console.log(`  ⚠️  Errors (not marked dead): ${errors.length}`);
  console.log(`  🪦 Previously dead: ${alreadyDead}`);

  if (newlyDead.length > 0) {
    console.log("\n── Newly Dead Jobs ─────────────────────────");
    for (const r of newlyDead) {
      console.log(
        `  💀 [${r.status}] "${r.title}" at ${r.company} — ${r.applyUrl}`
      );
    }
  }

  if (errors.length > 0) {
    console.log("\n── Errors (not marked dead) ────────────────");
    for (const r of errors.slice(0, 10)) {
      console.log(
        `  ⚠️  [${r.reason}] "${r.title}" — ${r.applyUrl}`
      );
    }
    if (errors.length > 10)
      console.log(`  ... and ${errors.length - 10} more`);
  }

  // Apply changes to the jobs array
  if (newlyDead.length > 0) {
    const deadIds = new Set(newlyDead.map((r) => r.id));
    const now = new Date().toISOString();

    const updatedJobs = jobs.map((job) => {
      if (deadIds.has(job.id)) {
        return { ...job, isDead: true, deadAt: now };
      }
      return job;
    });

    if (isDryRun) {
      console.log(
        `\n🧪 DRY RUN: Would mark ${newlyDead.length} jobs as dead. No file written.`
      );
    } else {
      // Atomic write: temp file + rename
      const tmpPath = JOBS_PATH + ".tmp";
      fs.writeFileSync(tmpPath, JSON.stringify(updatedJobs, null, 2));
      fs.renameSync(tmpPath, JOBS_PATH);
      console.log(
        `\n✏️  Marked ${newlyDead.length} jobs as dead in jobs.json`
      );
    }
  } else {
    console.log("\n✨ No dead jobs found. jobs.json unchanged.");
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ Dead job detection complete");
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
