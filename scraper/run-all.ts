/**
 * FrontendEngineers.com — Dumb Scraper
 * 
 * This script crawls the company career URLs in data/career_urls.json,
 * extracts all potential job postings, and saves them to data/raw_jobs.json
 * without any AI filtering. 
 * 
 * The filtering is handled entirely by the Antigravity Agent Skill.
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { scrapeDuckDuckGoJobs } from './crawl-urls';
import type { NormalizedJob } from './normalizer';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function log(msg: string) {
  console.log(msg);
}

async function main() {
  console.clear();
  log(`\n🚀 Starting Dumb Extractor for Antigravity Skill...`);
  
  // Phase 1: Scrape Jobs
  log(`\n🔍 Scraping Jobs via Playwright...`);
  const { jobs: ddgJobs } = await scrapeDuckDuckGoJobs(log);
  
  // Deduplicate
  const seen = new Set<string>();
  const uniqueCandidates = ddgJobs.filter(j => {
    if (seen.has(j.sourceHash)) return false;
    seen.add(j.sourceHash);
    return true;
  });
  
  log(`\n📊 Total unique raw candidate jobs found: ${uniqueCandidates.length}`);
  
  // Phase 2: Save to raw_jobs.json
  const outputPath = path.join(process.cwd(), 'data', 'raw_jobs.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueCandidates, null, 2));
  
  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
  log(`\n💾 Saved ${uniqueCandidates.length} RAW unfiltered jobs to data/raw_jobs.json (${fileSize} KB)`);
  log(`\n✅ Extractor complete! You can now use the Agentic Skill to filter these.`);
}

main().catch(err => {
  console.error(`\nFatal error:`, err);
  process.exit(1);
});
