/**
 * One-time script to filter existing jobs.json through Gemini AI.
 * 
 * This re-classifies all jobs currently in data/jobs.json and removes
 * any that are NOT frontend/JavaScript/TypeScript focused.
 * 
 * Usage: npx tsx scraper/clean-existing-jobs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { filterJobsWithGemini } from './gemini-filter';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  const jobsPath = path.join(process.cwd(), 'data', 'jobs.json');
  const raw = fs.readFileSync(jobsPath, 'utf-8');
  const jobs = JSON.parse(raw);

  console.log(`\n📋 Loaded ${jobs.length} jobs from jobs.json`);
  console.log(`🤖 Running Gemini AI classification...\n`);

  const { approvedIndices, results } = await filterJobsWithGemini(
    apiKey,
    jobs.map((j: any) => ({
      title: j.title,
      description: j.description || undefined,
      department: j.department || undefined,
    })),
    console.log
  );

  const approvedJobs = jobs.filter((_: any, i: number) => approvedIndices.has(i));
  const rejectedJobs = jobs.filter((_: any, i: number) => !approvedIndices.has(i));

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total jobs: ${jobs.length}`);
  console.log(`  ✅ Approved (frontend/JS/TS): ${approvedJobs.length}`);
  console.log(`  ❌ Rejected (not frontend): ${rejectedJobs.length}`);
  console.log(`${'═'.repeat(60)}\n`);

  // Show all rejected jobs
  console.log('Rejected jobs:');
  for (const result of results) {
    if (!result.approved) {
      const job = jobs[result.index];
      console.log(`  ❌ "${job.title}" at ${job.company?.name || 'Unknown'} — ${result.reason}`);
    }
  }

  console.log('\nApproved jobs:');
  for (const result of results) {
    if (result.approved) {
      const job = jobs[result.index];
      console.log(`  ✅ "${job.title}" at ${job.company?.name || 'Unknown'}`);
    }
  }

  // Backup original
  const backupPath = path.join(process.cwd(), 'data', 'jobs.backup.json');
  fs.writeFileSync(backupPath, raw);
  console.log(`\n💾 Backup saved to ${backupPath}`);

  // Write cleaned data
  fs.writeFileSync(jobsPath, JSON.stringify(approvedJobs, null, 2));
  console.log(`✅ Cleaned jobs.json: ${approvedJobs.length} frontend/JS/TS jobs (was ${jobs.length})`);
}

main().catch(console.error);
