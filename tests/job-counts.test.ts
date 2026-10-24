/**
 * tests/job-counts.test.ts
 *
 * Automated tests for job count logic, deduplication, and active filtering.
 * Verifies that active, dead, duplicate, and unpublished records are handled correctly.
 *
 * Usage:
 *   npx tsx tests/job-counts.test.ts
 */

import { deduplicateJobs, filterActiveJobs, normalizeTitle } from "../src/lib/jobs.server";
import type { Job } from "../src/lib/jobs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

function makeCompany(id: string, name: string) {
  return { id, name, logoUrl: null, industry: null, website: null };
}

function makeJob(partial: Partial<Job>): Job {
  return {
    id: "id",
    title: "title",
    description: "description",
    location: "Remote",
    country: "United States",
    remoteType: "REMOTE",
    postedAt: "2026-10-20T10:00:00Z",
    sourceHash: "hash",
    applyUrl: "https://example.com",
    company: makeCompany("c1", "Acme Corp"),
    ...partial,
  };
}

function runTests() {
  console.log("Running Job Count & Deduplication Tests...\n");

  const mockJobs: Job[] = [
    // 1. Standard active job
    makeJob({
      id: "job-1",
      title: "Senior React Engineer",
      applyUrl: "https://example.com/jobs/react-1?utm_source=feed",
      company: makeCompany("c1", "Acme Corp"),
      country: "United States",
      postedAt: "2026-10-20T10:00:00Z",
      isDead: false,
    }),
    // 2. Duplicate of job-1 with different query parameter and older timestamp
    makeJob({
      id: "job-1-duplicate",
      title: "Senior React Engineer",
      applyUrl: "https://example.com/jobs/react-1?ref=jobboard",
      company: makeCompany("c1", "Acme Corp"),
      country: "United States",
      postedAt: "2026-10-18T10:00:00Z",
      isDead: false,
    }),
    // 3. Same company & title duplicate with slightly different casing / whitespace
    makeJob({
      id: "job-1-title-dup",
      title: "Senior React Engineer - Remote",
      applyUrl: "https://different-ats.com/apply/2",
      company: makeCompany("c1", "Acme Corp"),
      country: "United States",
      postedAt: "2026-10-15T10:00:00Z",
      isDead: false,
    }),
    // 4. Dead / expired job
    makeJob({
      id: "job-dead",
      title: "Frontend Lead",
      applyUrl: "https://example.com/jobs/lead",
      company: makeCompany("c2", "Beta LLC"),
      country: "Germany",
      postedAt: "2026-10-21T10:00:00Z",
      isDead: true,
      deadAt: "2026-10-22T00:00:00Z",
    }),
    // 5. Unpublished / incomplete job (missing applyUrl)
    makeJob({
      id: "job-incomplete-1",
      title: "Vue Developer",
      applyUrl: "",
      company: makeCompany("c3", "Gamma Inc"),
      country: "Canada",
      postedAt: "2026-10-22T10:00:00Z",
    }),
    // 6. Unpublished / incomplete job (missing title)
    makeJob({
      id: "job-incomplete-2",
      title: "",
      applyUrl: "https://gamma.com/jobs/1",
      company: makeCompany("c3", "Gamma Inc"),
      country: "Canada",
      postedAt: "2026-10-22T10:00:00Z",
    }),
    // 7. Legitimate different job at same company
    makeJob({
      id: "job-2",
      title: "Junior TypeScript Engineer",
      applyUrl: "https://example.com/jobs/ts-junior",
      company: makeCompany("c1", "Acme Corp"),
      country: "United States",
      postedAt: "2026-10-22T12:00:00Z",
      isDead: false,
    }),
    // 8. Legitimate job in different country
    makeJob({
      id: "job-3",
      title: "Senior React Engineer",
      applyUrl: "https://example.com/jobs/react-uk",
      company: makeCompany("c1", "Acme Corp"),
      country: "United Kingdom",
      postedAt: "2026-10-22T12:00:00Z",
      isDead: false,
    }),
  ];

  // Test 1: Title normalization
  assert(
    normalizeTitle("Senior React Engineer - Remote") === "senior react engineer",
    "normalizeTitle strips remote suffix"
  );
  assert(
    normalizeTitle("Frontend Developer | Ref#12345") === "frontend developer",
    "normalizeTitle strips reference codes"
  );

  // Test 2: filterActiveJobs removes dead and unpublished records
  const activeJobs = filterActiveJobs(mockJobs);

  assert(
    !activeJobs.some((j) => j.isDead),
    "filterActiveJobs excludes dead jobs"
  );

  assert(
    !activeJobs.some((j) => !j.title || !j.applyUrl),
    "filterActiveJobs excludes incomplete/unpublished jobs"
  );

  // Test 3: Deduplication excludes duplicate URLs and duplicate (title, company, country)
  assert(
    !activeJobs.some((j) => j.id === "job-1-duplicate"),
    "deduplicateJobs excludes duplicate URL keeping newer record"
  );

  assert(
    !activeJobs.some((j) => j.id === "job-1-title-dup"),
    "deduplicateJobs excludes normalized (title, company, country) duplicates"
  );

  // Test 4: Legitimate unique jobs are preserved
  assert(
    activeJobs.some((j) => j.id === "job-1"),
    "Preserves original job-1"
  );
  assert(
    activeJobs.some((j) => j.id === "job-2"),
    "Preserves different job at same company"
  );
  assert(
    activeJobs.some((j) => j.id === "job-3"),
    "Preserves same title in different country"
  );

  assert(
    activeJobs.length === 3,
    `Expected exactly 3 active deduplicated jobs, got ${activeJobs.length}`
  );

  console.log("\n🎉 All Job Count & Deduplication tests passed successfully!");
}

runTests();
