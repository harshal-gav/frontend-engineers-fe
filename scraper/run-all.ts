/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FrontendEngineers.com — Master Scraper Dashboard           ║
 * ║                                                             ║
 * ║  Phase 1: Fetch from 6 job APIs (10,000+ companies)         ║
 * ║  Phase 2: Scrape 171 company career pages directly          ║
 * ║  Phase 3: Gemini AI filters for frontend/JS/TS only         ║
 * ║  Phase 4: Save to jobs.json → deploy to Vercel              ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * Usage:
 *   npm run scrape                    # Full scrape (APIs + companies)
 *   npm run scrape -- --api-only      # Only API sources (faster)
 *   npm run scrape -- --companies-only # Only 171 company career pages
 *   npm run scrape -- --dry-run       # Don't save to file
 *   npm run scrape -- --concurrency=5 # Parallel company scrapes
 *   npm run scrape -- --no-gemini     # Skip Gemini (use regex only)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { scrapeCompany, loadAllConfigs, type CompanyConfig } from './engine';
import { filterJobsWithGemini } from './gemini-filter';
import { fetchAllApiSources } from './api-sources';
import type { NormalizedJob } from './normalizer';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ─── ANSI Colors ──────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
};

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function progressBar(cur: number, total: number, w: number = 30): string {
  const pct = total > 0 ? cur / total : 0;
  const filled = Math.round(pct * w);
  return `[${c.bgGreen}${' '.repeat(filled)}${c.reset}${c.dim}${'░'.repeat(w - filled)}${c.reset}] ${(pct * 100).toFixed(0)}%`;
}

// ─── State ────────────────────────────────────────────────────
interface Stats {
  apiJobsFetched: number;
  apiJobsPreFiltered: number;
  companiesTotal: number;
  companiesCompleted: number;
  companiesFailed: number;
  companyJobsScraped: number;
  companyJobsRemote: number;
  totalBeforeGemini: number;
  geminiApproved: number;
  geminiRejected: number;
  approvedJobs: { title: string; company: string; location: string }[];
  companyResults: { name: string; approved: number; status: string }[];
  errors: string[];
  startTime: number;
}

const stats: Stats = {
  apiJobsFetched: 0,
  apiJobsPreFiltered: 0,
  companiesTotal: 0,
  companiesCompleted: 0,
  companiesFailed: 0,
  companyJobsScraped: 0,
  companyJobsRemote: 0,
  totalBeforeGemini: 0,
  geminiApproved: 0,
  geminiRejected: 0,
  approvedJobs: [],
  companyResults: [],
  errors: [],
  startTime: Date.now(),
};

function log(msg: string) {
  console.log(msg);
}

// ─── Phase 2: Company Career Page Scraping ────────────────────
async function scrapeCompanies(
  configs: CompanyConfig[],
  geminiApiKey: string | undefined,
  concurrency: number,
  dryRun: boolean
): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];
  let index = 0;
  stats.companiesTotal = configs.length;
  
  log(`\n${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
  log(`${c.bold}  📡 PHASE 2: Scraping ${configs.length} company career pages${c.reset}`);
  log(`${c.bold}  Concurrency: ${concurrency} | Gemini: ${geminiApiKey ? '✅' : '❌ (regex)'}${c.reset}`);
  log(`${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}\n`);
  
  async function processNext(): Promise<void> {
    while (index < configs.length) {
      const i = index++;
      const config = configs[i];
      
      try {
        const result = await scrapeCompany(config, config.slug, {
          dryRun,
          geminiApiKey,
          onProgress: (msg) => log(`  ${c.dim}[${config.company}]${c.reset} ${msg}`),
        });
        
        stats.companyJobsScraped += result.totalFound + result.totalFilteredByGemini;
        allJobs.push(...result.jobs);
        
        for (const job of result.jobs) {
          stats.approvedJobs.push({
            title: job.title,
            company: job.company?.name || config.company,
            location: job.location || 'Remote',
          });
        }
        
        stats.companyResults.push({
          name: config.company,
          approved: result.totalFound,
          status: result.totalFound > 0 ? 'success' : result.errors.length > 0 ? 'failed' : 'empty',
        });
        
        if (result.errors.length > 0) {
          stats.companiesFailed++;
          stats.errors.push(...result.errors.map(e => `${config.company}: ${e}`));
        }
        stats.companiesCompleted++;
        
        // Progress every 10 companies
        if (stats.companiesCompleted % 10 === 0) {
          log(`\n  ${progressBar(stats.companiesCompleted, stats.companiesTotal)} ${stats.companiesCompleted}/${stats.companiesTotal} companies | ${c.green}${allJobs.length} frontend jobs found${c.reset}\n`);
        }
        
      } catch (err) {
        stats.companiesFailed++;
        stats.companiesCompleted++;
        const msg = err instanceof Error ? err.message : String(err);
        stats.errors.push(`${config.company}: ${msg}`);
      }
    }
  }
  
  const workers = Array.from({ length: concurrency }, () => processNext());
  await Promise.all(workers);
  
  log(`\n  ${c.green}✅ Company scraping complete: ${allJobs.length} frontend jobs from ${stats.companiesCompleted} companies${c.reset}\n`);
  
  return allJobs;
}

// ─── Phase 3: Gemini AI Classification ────────────────────────
async function geminiClassify(
  jobs: NormalizedJob[],
  apiKey: string
): Promise<NormalizedJob[]> {
  log(`\n${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
  log(`${c.bold}  🤖 PHASE 3: Gemini AI Classification (${jobs.length} jobs)${c.reset}`);
  log(`${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}\n`);
  
  stats.totalBeforeGemini = jobs.length;
  
  const { approvedIndices } = await filterJobsWithGemini(
    apiKey,
    jobs.map(j => ({
      title: j.title,
      description: j.description || undefined,
      department: j.department || undefined,
    })),
    log
  );
  
  const approved = jobs.filter((_, i) => approvedIndices.has(i));
  stats.geminiApproved = approved.length;
  stats.geminiRejected = jobs.length - approved.length;
  
  log(`\n  ${c.green}✅ Gemini approved: ${approved.length}${c.reset} / ${c.red}Rejected: ${jobs.length - approved.length}${c.reset}\n`);
  
  return approved;
}

// ─── Final Report ─────────────────────────────────────────────
function printFinalReport(totalSaved: number) {
  const elapsed = Date.now() - stats.startTime;
  
  console.log(`\n`);
  console.log(`${c.green}${c.bold}╔${'═'.repeat(68)}╗${c.reset}`);
  console.log(`${c.green}${c.bold}║  🎉 SCRAPE COMPLETE — Final Report${' '.repeat(33)}║${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ⏱️  Total Duration: ${c.bold}${formatDuration(elapsed)}${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}📡 API SOURCES (10,000+ companies)${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}     Total fetched:     ${c.bold}${stats.apiJobsFetched.toLocaleString()}${c.reset} jobs`);
  console.log(`${c.green}${c.bold}║${c.reset}     Pre-filtered:      ${stats.apiJobsPreFiltered.toLocaleString()} potential frontend jobs`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🏢 DIRECT COMPANY SCRAPING${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}     Companies scraped:  ${stats.companiesCompleted} / ${stats.companiesTotal}`);
  console.log(`${c.green}${c.bold}║${c.reset}     Companies failed:   ${stats.companiesFailed}`);
  console.log(`${c.green}${c.bold}║${c.reset}     Jobs from companies:${stats.companyJobsScraped.toLocaleString()}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🤖 GEMINI AI FILTER${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}     Sent to Gemini:     ${stats.totalBeforeGemini.toLocaleString()}`);
  console.log(`${c.green}${c.bold}║${c.reset}     ${c.green}✅ Approved:${c.reset}        ${c.green}${c.bold}${stats.geminiApproved.toLocaleString()}${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}     ${c.red}❌ Rejected:${c.reset}        ${stats.geminiRejected.toLocaleString()}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}💾 FINAL OUTPUT${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}     ${c.green}${c.bold}${totalSaved.toLocaleString()} unique frontend/JS/TS remote jobs saved${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  
  // Top companies
  const topCompanies = stats.companyResults
    .filter(r => r.approved > 0)
    .sort((a, b) => b.approved - a.approved)
    .slice(0, 10);
  
  if (topCompanies.length > 0) {
    console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🏆 Top Companies${c.reset}`);
    for (const co of topCompanies) {
      console.log(`${c.green}${c.bold}║${c.reset}     ${co.name.padEnd(25)} ${c.green}${'█'.repeat(Math.min(co.approved, 20))}${c.reset} ${co.approved}`);
    }
    console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  }
  
  // Unique companies from API sources
  const uniqueCompanies = new Set(stats.approvedJobs.map(j => j.company));
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🌍 Companies represented: ${c.cyan}${uniqueCompanies.size}${c.reset}`);
  
  // Sample jobs
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}📋 Sample Approved Jobs (20 of ${stats.approvedJobs.length})${c.reset}`);
  for (const j of stats.approvedJobs.slice(0, 20)) {
    console.log(`${c.green}${c.bold}║${c.reset}     ${c.green}✅${c.reset} ${j.title}`);
    console.log(`${c.green}${c.bold}║${c.reset}        ${c.dim}at ${j.company} · ${j.location}${c.reset}`);
  }
  
  console.log(`${c.green}${c.bold}╚${'═'.repeat(68)}╝${c.reset}`);
  
  // Next steps
  console.log(`\n${c.bold}📌 Next Steps:${c.reset}`);
  console.log(`   ${c.dim}1. Review the jobs above${c.reset}`);
  console.log(`   ${c.dim}2. Commit: ${c.cyan}git add data/jobs.json && git commit -m "Refresh: ${totalSaved} frontend jobs"${c.reset}`);
  console.log(`   ${c.dim}3. Deploy: ${c.cyan}git push${c.reset} → Vercel auto-deploys!${c.reset}\n`);
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apiOnly = args.includes('--api-only');
  const companiesOnly = args.includes('--companies-only');
  const noGemini = args.includes('--no-gemini');
  const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '3');
  const geminiApiKey = noGemini ? undefined : process.env.GEMINI_API_KEY;
  
  const configs = loadAllConfigs();
  
  // Banner
  console.clear();
  console.log(`${c.cyan}${c.bold}`);
  console.log(`  ╔══════════════════════════════════════════════════════════════╗`);
  console.log(`  ║                                                            ║`);
  console.log(`  ║   🚀  FrontendEngineers.com — Master Job Scraper           ║`);
  console.log(`  ║                                                            ║`);
  console.log(`  ╠══════════════════════════════════════════════════════════════╣`);
  console.log(`  ║  Mode:         ${dryRun ? '🔍 DRY RUN' : '💾 LIVE'}${' '.repeat(dryRun ? 35 : 37)}║`);
  console.log(`  ║  API Sources:  ${apiOnly || !companiesOnly ? '✅ 6 APIs (10K+ companies)' : '❌ Skipped'}${' '.repeat(apiOnly || !companiesOnly ? 18 : 33)}║`);
  console.log(`  ║  Companies:    ${companiesOnly || !apiOnly ? `✅ ${configs.length} direct career pages` : '❌ Skipped'}${' '.repeat(companiesOnly || !apiOnly ? 16 : 33)}║`);
  console.log(`  ║  Gemini AI:    ${geminiApiKey ? '✅ Smart filtering' : '❌ Regex fallback'}${' '.repeat(geminiApiKey ? 26 : 27)}║`);
  console.log(`  ║  Concurrency:  ${concurrency}${' '.repeat(43)}║`);
  console.log(`  ╚══════════════════════════════════════════════════════════════╝`);
  console.log(`${c.reset}`);
  
  if (!geminiApiKey) {
    console.log(`${c.yellow}  ⚠️ No GEMINI_API_KEY — using regex filter (less accurate)${c.reset}\n`);
  }
  
  console.log(`${c.dim}  Starting in 2 seconds...${c.reset}\n`);
  await new Promise(r => setTimeout(r, 2000));
  
  let allCandidateJobs: NormalizedJob[] = [];
  
  // Phase 1: API Sources
  if (!companiesOnly) {
    log(`${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
    log(`${c.bold}  📡 PHASE 1: Fetching from 6 Job Aggregator APIs${c.reset}`);
    log(`${c.bold}  Coverage: RemoteOK · Remotive · Arbeitnow · Jobicy · Himalayas · FindWork${c.reset}`);
    log(`${c.cyan}${c.bold}═══════════════════════════════════════════════════════════════${c.reset}`);
    
    const { allJobs: apiJobs, results } = await fetchAllApiSources(log);
    
    stats.apiJobsFetched = results.reduce((s, r) => s + r.totalFetched, 0);
    stats.apiJobsPreFiltered = apiJobs.length;
    
    allCandidateJobs.push(...apiJobs);
  }
  
  // Phase 2: Company Career Pages
  if (!apiOnly) {
    const companyJobs = await scrapeCompanies(configs, geminiApiKey, concurrency, dryRun);
    allCandidateJobs.push(...companyJobs);
  }
  
  // Global deduplication
  const seen = new Set<string>();
  const uniqueCandidates = allCandidateJobs.filter(j => {
    if (seen.has(j.sourceHash)) return false;
    seen.add(j.sourceHash);
    return true;
  });
  
  log(`\n${c.bold}📊 Total unique candidate jobs: ${uniqueCandidates.length}${c.reset}\n`);
  
  // Phase 3: Gemini AI Classification (for API-sourced jobs that haven't been classified)
  let finalJobs: NormalizedJob[];
  
  if (geminiApiKey && !companiesOnly && uniqueCandidates.length > 0) {
    finalJobs = await geminiClassify(uniqueCandidates, geminiApiKey);
  } else {
    finalJobs = uniqueCandidates;
    stats.geminiApproved = uniqueCandidates.length;
  }
  
  // Update approved jobs list
  stats.approvedJobs = finalJobs.map(j => ({
    title: j.title,
    company: j.company?.name || 'Unknown',
    location: j.location || 'Remote',
  }));
  
  // Merge with existing jobs, deduplicate, and sort
  let finalJobsToSave: NormalizedJob[] = finalJobs;
  let statsMerged = 0;
  let statsRemovedOld = 0;
  
  if (!dryRun) {
    const outputPath = path.join(process.cwd(), 'data', 'jobs.json');
    let existingJobs: NormalizedJob[] = [];
    
    if (fs.existsSync(outputPath)) {
      try {
        existingJobs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      } catch (e) {
        console.error('Failed to parse existing jobs.json, starting fresh.');
      }
    }
    
    // 60 days ago threshold
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    
    // Filter out old jobs from existing
    const validExistingJobs = existingJobs.filter(j => {
      if (!j.postedAt) return true;
      return new Date(j.postedAt) >= cutoffDate;
    });
    
    statsRemovedOld = existingJobs.length - validExistingJobs.length;
    
    // Merge new and valid existing
    const combined = [...finalJobs, ...validExistingJobs];
    
    // Global deduplication across all jobs
    const finalSeen = new Set<string>();
    finalJobsToSave = combined.filter(j => {
      // Use sourceHash if it exists, otherwise fallback to id
      const hash = j.sourceHash || j.id;
      if (finalSeen.has(hash)) return false;
      finalSeen.add(hash);
      return true;
    });
    
    // Sort by posted date (newest first)
    finalJobsToSave.sort((a, b) => {
      const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    statsMerged = validExistingJobs.length;
    
    // Save
    fs.writeFileSync(outputPath, JSON.stringify(finalJobsToSave, null, 2));
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
    
    log(`\n${c.green}${c.bold}💾 Saved ${finalJobsToSave.length} total jobs to data/jobs.json (${fileSize} KB)${c.reset}`);
    if (statsMerged > 0) log(`   ${c.dim}↳ Included ${statsMerged} existing active jobs${c.reset}`);
    if (statsRemovedOld > 0) log(`   ${c.dim}↳ Removed ${statsRemovedOld} expired jobs (>60 days old)${c.reset}`);
    
  } else if (dryRun) {
    log(`\n${c.yellow}${c.bold}🔍 Dry run — no files saved${c.reset}`);
  }
  
  printFinalReport(finalJobsToSave.length);
}

main().catch(err => {
  console.error(`\n${c.red}${c.bold}Fatal error:${c.reset}`, err);
  process.exit(1);
});
