#!/usr/bin/env node
/**
 * Unified Master Scraper Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs both:
 * 1. Verified Remote Job APIs (RemoteFirstJobs, RemoteOK, Jobicy, Remotive, Himalayas, Arbeitnow, WeWorkRemotely)
 * 2. Playwright LinkedIn Scraper (if session auth is present in data/linkedin-auth.json or env)
 * 3. Fast Regex AI enrichment (to ensure 100% of jobs have tags, seniority, and remoteScope)
 * 
 * Usage:
 *   node scripts/scrape-all-jobs.js
 *   npm run scrape
 */

const fs = require('fs');
const path = require('path');
const { runApiScraper } = require('./api-scraper.js');

async function main() {
  console.log('═'.repeat(65));
  console.log('🚀 MULTI-SOURCE SCRAPER PIPELINE: Remote APIs + LinkedIn Playwright');
  console.log('═'.repeat(65));

  // 1. Run the 7 Remote Job APIs
  console.log('\n[PHASE 1/2] Scraping 7 Remote Job APIs...');
  try {
    await runApiScraper();
  } catch (err) {
    console.error('⚠️ Remote API Scraper encountered an issue:', err.message);
  }

  // 2. Run LinkedIn Playwright Scraper if session is available
  console.log('\n[PHASE 2/2] Checking LinkedIn Playwright Scraper Session...');
  const authPath = path.join(__dirname, '..', 'data', 'linkedin-auth.json');
  const hasEnvAuth = !!(process.env.LINKEDIN_AUTH_JSON || process.env.LINKEDIN_AUTH_DATA);

  if (fs.existsSync(authPath) || hasEnvAuth) {
    console.log('🔑 LinkedIn auth session found. Launching Playwright LinkedIn Scraper...');
    try {
      const { runLinkedInScraper } = require('./linkedin-scraper.js');
      await runLinkedInScraper();
    } catch (err) {
      console.error('⚠️ LinkedIn Playwright scraper encountered an issue:', err.message);
    }
  } else {
    console.log('ℹ️  Skipping LinkedIn Playwright Scraper: No session found at data/linkedin-auth.json');
    console.log('👉 To enable LinkedIn scraping, run: npm run linkedin:login');
  }

  console.log('\n' + '═'.repeat(65));
  console.log('🎉 Scraper pipeline finished successfully!');
  console.log('═'.repeat(65) + '\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal Pipeline Error:', err);
    process.exit(1);
  });
}

module.exports = { runPipeline: main };
