/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FrontendEngineers.com — Full Scraper Dashboard             ║
 * ║  Scrapes ALL companies, filters with Gemini AI,             ║
 * ║  and saves to jobs.json for deployment.                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * Usage:
 *   npx tsx scraper/run-all.ts                  # Full scrape
 *   npx tsx scraper/run-all.ts --concurrency=5  # 5 at a time
 *   npx tsx scraper/run-all.ts --dry-run        # Don't save
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { scrapeCompany, loadAllConfigs, type CompanyConfig, type ScrapeResult } from './engine';
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
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m',
  bgMagenta: '\x1b[45m',
};

// ─── Dashboard State ──────────────────────────────────────────
interface DashboardState {
  totalCompanies: number;
  completedCompanies: number;
  failedCompanies: number;
  skippedCompanies: number;
  currentlyProcessing: string[];
  totalJobsScraped: number;
  totalRemoteFound: number;
  totalApproved: number;
  totalRejected: number;
  totalErrors: number;
  startTime: number;
  companyResults: CompanyResult[];
  recentLogs: string[];
  approvedJobs: { title: string; company: string; location: string }[];
}

interface CompanyResult {
  name: string;
  status: 'success' | 'failed' | 'no-jobs' | 'no-frontend';
  totalScraped: number;
  remoteFound: number;
  approved: number;
  rejected: number;
  duration: number;
  errors: string[];
}

const state: DashboardState = {
  totalCompanies: 0,
  completedCompanies: 0,
  failedCompanies: 0,
  skippedCompanies: 0,
  currentlyProcessing: [],
  totalJobsScraped: 0,
  totalRemoteFound: 0,
  totalApproved: 0,
  totalRejected: 0,
  totalErrors: 0,
  startTime: Date.now(),
  companyResults: [],
  recentLogs: [],
  approvedJobs: [],
};

// ─── Logging ──────────────────────────────────────────────────
function addLog(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  state.recentLogs.push(`${c.dim}[${timestamp}]${c.reset} ${msg}`);
  // Keep last 200 logs
  if (state.recentLogs.length > 200) {
    state.recentLogs.shift();
  }
}

function printLog(msg: string) {
  addLog(msg);
  console.log(msg);
}

// ─── Progress Bar ─────────────────────────────────────────────
function progressBar(current: number, total: number, width: number = 30): string {
  const pct = total > 0 ? current / total : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const bar = `${c.bgGreen}${' '.repeat(filled)}${c.reset}${c.dim}${'░'.repeat(empty)}${c.reset}`;
  return `[${bar}] ${(pct * 100).toFixed(1)}%`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ─── Dashboard Printer ───────────────────────────────────────
function printDashboard() {
  const elapsed = Date.now() - state.startTime;
  const companiesPerSec = state.completedCompanies / (elapsed / 1000) || 0;
  const remaining = state.totalCompanies - state.completedCompanies - state.failedCompanies;
  const eta = companiesPerSec > 0 ? remaining / companiesPerSec * 1000 : 0;

  console.log('\n');
  console.log(`${c.cyan}${c.bold}╔${'═'.repeat(68)}╗${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.bold}🚀 FrontendEngineers.com — Scraper Dashboard${c.reset}${' '.repeat(23)}${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  
  // Progress
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.bold}Progress:${c.reset} ${progressBar(state.completedCompanies + state.failedCompanies, state.totalCompanies, 25)} ${state.completedCompanies + state.failedCompanies}/${state.totalCompanies} companies`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.bold}Elapsed:${c.reset}  ${formatDuration(elapsed)}  ${c.dim}|${c.reset}  ${c.bold}ETA:${c.reset} ${eta > 0 ? formatDuration(eta) : 'calculating...'}  ${c.dim}|${c.reset}  ${c.bold}Speed:${c.reset} ${companiesPerSec.toFixed(1)} co/s`);
  
  console.log(`${c.cyan}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  
  // Stats
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.bold}📊 STATS${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} Total Jobs Scraped:     ${c.bold}${state.totalJobsScraped.toLocaleString()}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} Remote Jobs Found:      ${c.cyan}${c.bold}${state.totalRemoteFound.toLocaleString()}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} ${c.green}✅ Approved (Frontend):${c.reset}  ${c.green}${c.bold}${state.totalApproved.toLocaleString()}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} ${c.red}❌ Rejected (Non-FE):${c.reset}   ${c.red}${state.totalRejected.toLocaleString()}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} Companies Completed:    ${c.green}${state.completedCompanies}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}├──${c.reset} Companies Failed:       ${state.failedCompanies > 0 ? c.red : ''}${state.failedCompanies}${c.reset}`);
  console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}└──${c.reset} Errors:                 ${state.totalErrors > 0 ? c.yellow : ''}${state.totalErrors}${c.reset}`);
  
  // Currently processing
  if (state.currentlyProcessing.length > 0) {
    console.log(`${c.cyan}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
    console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.bold}⏳ Currently Scraping:${c.reset}`);
    for (const name of state.currentlyProcessing) {
      console.log(`${c.cyan}${c.bold}║${c.reset}  ${c.dim}   ⟳${c.reset} ${c.yellow}${name}${c.reset}`);
    }
  }
  
  console.log(`${c.cyan}${c.bold}╚${'═'.repeat(68)}╝${c.reset}`);
}

// ─── Final Report ─────────────────────────────────────────────
function printFinalReport() {
  const elapsed = Date.now() - state.startTime;
  
  console.log('\n\n');
  console.log(`${c.green}${c.bold}╔${'═'.repeat(68)}╗${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🎉 SCRAPE COMPLETE — Final Report${c.reset}${' '.repeat(35)}${c.green}${c.bold}║${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  Duration: ${c.bold}${formatDuration(elapsed)}${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  Companies Scraped: ${c.bold}${state.completedCompanies}${c.reset} / ${state.totalCompanies}`);
  console.log(`${c.green}${c.bold}║${c.reset}  Companies Failed:  ${state.failedCompanies > 0 ? c.red + c.bold : ''}${state.failedCompanies}${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}📊 JOB STATISTICS${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  Total Raw Jobs Scraped:  ${c.bold}${state.totalJobsScraped.toLocaleString()}${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  Remote Jobs Found:       ${c.cyan}${c.bold}${state.totalRemoteFound.toLocaleString()}${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.green}✅ Frontend/JS/TS Jobs:${c.reset}   ${c.green}${c.bold}${state.totalApproved.toLocaleString()}${c.reset}`);
  console.log(`${c.green}${c.bold}║${c.reset}  ${c.red}❌ Non-Frontend Rejected:${c.reset} ${c.red}${state.totalRejected.toLocaleString()}${c.reset}`);
  console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  
  // Top companies by approved jobs
  const topCompanies = state.companyResults
    .filter(r => r.approved > 0)
    .sort((a, b) => b.approved - a.approved)
    .slice(0, 15);
  
  if (topCompanies.length > 0) {
    console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}🏆 TOP COMPANIES (by approved frontend jobs)${c.reset}`);
    for (const co of topCompanies) {
      const bar = '█'.repeat(Math.min(co.approved, 30));
      console.log(`${c.green}${c.bold}║${c.reset}  ${c.dim}${co.name.padEnd(25)}${c.reset} ${c.green}${bar}${c.reset} ${c.bold}${co.approved}${c.reset}`);
    }
    console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  }
  
  // Failed companies
  const failed = state.companyResults.filter(r => r.status === 'failed');
  if (failed.length > 0) {
    console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}⚠️  FAILED COMPANIES (${failed.length})${c.reset}`);
    for (const co of failed.slice(0, 10)) {
      console.log(`${c.green}${c.bold}║${c.reset}  ${c.red}  ✗ ${co.name}${c.reset}: ${c.dim}${co.errors[0] || 'Unknown error'}${c.reset}`);
    }
    if (failed.length > 10) {
      console.log(`${c.green}${c.bold}║${c.reset}  ${c.dim}  ... and ${failed.length - 10} more${c.reset}`);
    }
    console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  }
  
  // Sample approved jobs
  if (state.approvedJobs.length > 0) {
    console.log(`${c.green}${c.bold}║${c.reset}  ${c.bold}📋 SAMPLE APPROVED JOBS (showing 20 of ${state.approvedJobs.length})${c.reset}`);
    for (const job of state.approvedJobs.slice(0, 20)) {
      console.log(`${c.green}${c.bold}║${c.reset}  ${c.green}  ✅${c.reset} ${job.title}`);
      console.log(`${c.green}${c.bold}║${c.reset}  ${c.dim}     at ${job.company} · ${job.location || 'Remote'}${c.reset}`);
    }
    console.log(`${c.green}${c.bold}╠${'═'.repeat(68)}╣${c.reset}`);
  }
  
  console.log(`${c.green}${c.bold}╚${'═'.repeat(68)}╝${c.reset}`);
}

// ─── Scrape with concurrency control ──────────────────────────
async function scrapeWithConcurrency(
  configs: CompanyConfig[],
  geminiApiKey: string | undefined,
  concurrency: number,
  dryRun: boolean
): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];
  let index = 0;
  
  async function processNext(): Promise<void> {
    while (index < configs.length) {
      const currentIndex = index++;
      const config = configs[currentIndex];
      
      state.currentlyProcessing.push(config.company);
      
      const companyLog = (msg: string) => {
        printLog(`${c.magenta}[${config.company}]${c.reset} ${msg}`);
      };
      
      try {
        companyLog(`${c.yellow}Starting scrape...${c.reset}`);
        
        const result = await scrapeCompany(config, config.slug, {
          dryRun,
          geminiApiKey,
          onProgress: companyLog,
        });
        
        // Update state
        state.totalJobsScraped += result.totalFound + result.totalFilteredByGemini;
        state.totalApproved += result.totalFound;
        state.totalRejected += result.totalFilteredByGemini;
        state.totalErrors += result.errors.length;
        
        // Track approved jobs for display
        for (const job of result.jobs) {
          state.approvedJobs.push({
            title: job.title,
            company: job.company?.name || config.company,
            location: job.location || 'Remote',
          });
          allJobs.push(job);
        }
        
        const companyResult: CompanyResult = {
          name: config.company,
          status: result.errors.length > 0 && result.totalFound === 0 ? 'failed' 
                 : result.totalFound > 0 ? 'success' 
                 : 'no-frontend',
          totalScraped: result.totalFound + result.totalFilteredByGemini,
          remoteFound: result.totalFound + result.totalFilteredByGemini,
          approved: result.totalFound,
          rejected: result.totalFilteredByGemini,
          duration: result.duration,
          errors: result.errors,
        };
        
        state.companyResults.push(companyResult);
        
        if (result.totalFound > 0) {
          state.completedCompanies++;
          companyLog(`${c.green}✅ Done: ${result.totalFound} frontend jobs approved${c.reset}`);
        } else if (result.errors.length > 0) {
          state.failedCompanies++;
          companyLog(`${c.red}❌ Failed: ${result.errors[0]}${c.reset}`);
        } else {
          state.completedCompanies++;
          companyLog(`${c.dim}Done: No frontend/JS/TS jobs found${c.reset}`);
        }
        
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        state.failedCompanies++;
        state.totalErrors++;
        state.companyResults.push({
          name: config.company,
          status: 'failed',
          totalScraped: 0,
          remoteFound: 0,
          approved: 0,
          rejected: 0,
          duration: 0,
          errors: [errMsg],
        });
        companyLog(`${c.red}❌ Fatal error: ${errMsg}${c.reset}`);
      }
      
      // Remove from currently processing
      state.currentlyProcessing = state.currentlyProcessing.filter(n => n !== config.company);
      
      // Print mini dashboard every 10 companies
      if ((state.completedCompanies + state.failedCompanies) % 10 === 0) {
        printDashboard();
      }
    }
  }
  
  // Launch concurrent workers
  const workers = Array.from({ length: concurrency }, () => processNext());
  await Promise.all(workers);
  
  return allJobs;
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const concurrency = parseInt(
    args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '3'
  );
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  // Load all configs
  const configs = loadAllConfigs();
  state.totalCompanies = configs.length;
  
  // Print startup banner
  console.clear();
  console.log(`${c.cyan}${c.bold}`);
  console.log(`  ╔══════════════════════════════════════════════════════════════╗`);
  console.log(`  ║                                                            ║`);
  console.log(`  ║   🚀  FrontendEngineers.com — Job Scraper                  ║`);
  console.log(`  ║                                                            ║`);
  console.log(`  ╠══════════════════════════════════════════════════════════════╣`);
  console.log(`  ║  Mode:          ${dryRun ? '🔍 DRY RUN (no save)' : '💾 LIVE (will save)'}${' '.repeat(dryRun ? 20 : 18)}║`);
  console.log(`  ║  Companies:     ${String(configs.length).padEnd(42)}║`);
  console.log(`  ║  Concurrency:   ${String(concurrency).padEnd(42)}║`);
  console.log(`  ║  Gemini AI:     ${geminiApiKey ? '✅ ENABLED (smart filtering)' : '❌ DISABLED (regex fallback)'}${' '.repeat(geminiApiKey ? 14 : 12)}║`);
  console.log(`  ╚══════════════════════════════════════════════════════════════╝`);
  console.log(`${c.reset}`);
  
  if (!geminiApiKey) {
    console.log(`${c.yellow}⚠️  No GEMINI_API_KEY in .env — using basic regex filter instead of AI${c.reset}\n`);
  }
  
  console.log(`${c.dim}Starting in 2 seconds...${c.reset}\n`);
  await new Promise(r => setTimeout(r, 2000));
  
  // Run the scraper
  const allJobs = await scrapeWithConcurrency(configs, geminiApiKey, concurrency, dryRun);
  
  // Final dashboard
  printDashboard();
  
  // Save results
  if (!dryRun && allJobs.length > 0) {
    const outputPath = path.join(process.cwd(), 'data', 'jobs.json');
    
    // Deduplicate by sourceHash
    const uniqueJobs = Array.from(
      new Map(allJobs.map(j => [j.sourceHash, j])).values()
    );
    
    // Sort by postedAt (newest first)
    uniqueJobs.sort((a, b) => {
      const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    fs.writeFileSync(outputPath, JSON.stringify(uniqueJobs, null, 2));
    
    console.log(`\n${c.green}${c.bold}💾 Saved ${uniqueJobs.length} unique frontend/JS/TS jobs to data/jobs.json${c.reset}`);
    console.log(`${c.dim}   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB${c.reset}`);
  } else if (dryRun) {
    console.log(`\n${c.yellow}${c.bold}🔍 Dry run complete — no files were saved${c.reset}`);
  }
  
  // Print final report
  printFinalReport();
  
  // Next steps
  console.log(`\n${c.bold}📌 Next Steps:${c.reset}`);
  console.log(`${c.dim}   1. Review the jobs above${c.reset}`);
  console.log(`${c.dim}   2. Push to GitHub:  ${c.cyan}git add . && git commit -m "Refresh jobs" && git push${c.reset}`);
  console.log(`${c.dim}   3. Vercel will auto-deploy with fresh jobs!${c.reset}\n`);
}

main().catch(err => {
  console.error(`\n${c.red}${c.bold}Fatal error:${c.reset}`, err);
  process.exit(1);
});
