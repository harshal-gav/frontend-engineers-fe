import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeJob, type RawScrapedJob, type NormalizedJob } from './normalizer';

// ─── Types ────────────────────────────────────────────────────────

export interface CompanyConfig {
  company: string;
  slug: string;
  careersUrl: string;
  website: string;
  industry: string;
  atsType: string; // greenhouse, lever, ashby, workday, custom
  boardUrl: string;
  logoUrl?: string;
  selectors: {
    jobList: string;
    jobTitle: string;
    jobLocation?: string;
    jobDepartment?: string;
    jobLink: string;
    jobSalary?: string;
    jobType?: string;
  };
  pagination: {
    type: 'none' | 'scroll' | 'click' | 'url';
    maxScrolls?: number;
    scrollDelayMs?: number;
    nextButtonSelector?: string;
    urlPattern?: string; // e.g. "?page={page}"
    maxPages?: number;
  };
  crawlIntervalHours: number;
  respectRobotsTxt: boolean;
  requestDelayMs?: number;
  userAgentRotation?: boolean;
}

export interface ScrapeResult {
  company: string;
  jobs: NormalizedJob[];
  errors: string[];
  totalFound: number;
  duration: number;
}

// ─── User Agent Pool ──────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Helpers ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(baseMs: number): number {
  // Add 30-70% random jitter
  const jitter = baseMs * (0.3 + Math.random() * 0.4);
  return Math.round(baseMs + jitter);
}

// ─── ATS-Specific Extractors ──────────────────────────────────────

async function extractGreenhouseJobs(page: Page, config: CompanyConfig): Promise<RawScrapedJob[]> {
  return page.evaluate((boardUrl: string) => {
    const jobs: RawScrapedJob[] = [];

    // Greenhouse boards typically render job listings as links within sections
    const sections = document.querySelectorAll('.level-0, .department, section');

    for (const section of sections) {
      const department = section.querySelector('h2, h3, .department-name')?.textContent?.trim() || '';
      const openings = section.querySelectorAll('.opening, .job-post');

      for (const opening of openings) {
        const linkEl = opening.querySelector('a');
        const locationEl = opening.querySelector('.location, span:last-child');

        if (linkEl) {
          const title = linkEl.textContent?.trim() || '';
          let url = linkEl.getAttribute('href') || '';
          if (url && !url.startsWith('http')) {
            url = new URL(url, boardUrl).href;
          }

          jobs.push({
            title,
            url,
            location: locationEl?.textContent?.trim() || '',
            department,
            description: opening.textContent?.trim()?.substring(0, 500) || '',
          });
        }
      }
    }

    // Fallback: if no sections found, try direct link extraction
    if (jobs.length === 0) {
      const allLinks = document.querySelectorAll('a[href]');
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        if (href.includes('/jobs/') && text.length > 3 && text.length < 200) {
          const fullUrl = href.startsWith('http') ? href : new URL(href, boardUrl).href;
          const parent = link.closest('tr, li, div, .opening');
          const locationEl = parent?.querySelector('.location, td:last-child, span:last-child');

          jobs.push({
            title: text,
            url: fullUrl,
            location: locationEl?.textContent?.trim() || '',
            description: parent?.textContent?.trim()?.substring(0, 500) || text,
          });
        }
      }
    }

    return jobs;
  }, config.boardUrl);
}

async function extractLeverJobs(page: Page, config: CompanyConfig): Promise<RawScrapedJob[]> {
  return page.evaluate((boardUrl: string) => {
    const jobs: RawScrapedJob[] = [];
    const postings = document.querySelectorAll('.posting');

    for (const posting of postings) {
      const titleEl = posting.querySelector('.posting-title h5, .posting-name, a h5');
      const locationEl = posting.querySelector('.posting-categories .location, .sort-by-location, [class*="location"]');
      const commitmentEl = posting.querySelector('.posting-categories .commitment, .sort-by-commitment, [class*="commitment"]');
      const teamEl = posting.querySelector('.posting-categories .department, .sort-by-team, [class*="team"]');
      const linkEl = posting.querySelector('a.posting-title, a[href*="/jobs/"]') || posting.closest('a');

      let url = linkEl?.getAttribute('href') || '';
      if (url && !url.startsWith('http')) {
        url = new URL(url, boardUrl).href;
      }

      const title = titleEl?.textContent?.trim() || '';
      if (title) {
        jobs.push({
          title,
          url,
          location: locationEl?.textContent?.trim() || '',
          type: commitmentEl?.textContent?.trim() || '',
          department: teamEl?.textContent?.trim() || '',
          description: posting.textContent?.trim()?.substring(0, 500) || '',
        });
      }
    }

    return jobs;
  }, config.boardUrl);
}

async function extractAshbyJobs(page: Page, config: CompanyConfig): Promise<RawScrapedJob[]> {
  // Ashby boards are React SPAs — wait for content to render
  await sleep(3000);

  return page.evaluate((boardUrl: string) => {
    const jobs: RawScrapedJob[] = [];

    // Ashby renders job postings in a list
    const postings = document.querySelectorAll('[class*="posting"], [class*="job"], a[href*="/jobs/"]');

    for (const posting of postings) {
      let linkEl: Element | null;
      let title = '';
      let url = '';

      if (posting.tagName === 'A') {
        linkEl = posting;
        title = posting.querySelector('h3, [class*="title"], [class*="name"]')?.textContent?.trim()
          || posting.textContent?.trim()?.substring(0, 150) || '';
        url = posting.getAttribute('href') || '';
      } else {
        linkEl = posting.querySelector('a[href*="/jobs/"]') || posting.querySelector('a');
        title = posting.querySelector('h3, [class*="title"], [class*="name"]')?.textContent?.trim()
          || linkEl?.textContent?.trim() || '';
        url = linkEl?.getAttribute('href') || '';
      }

      if (url && !url.startsWith('http')) {
        url = new URL(url, boardUrl).href;
      }

      const locationEl = posting.querySelector('[class*="location"], [class*="subtitle"], [class*="info"]');
      const departmentEl = posting.querySelector('[class*="department"], [class*="team"]');

      if (title && title.length > 3) {
        jobs.push({
          title,
          url,
          location: locationEl?.textContent?.trim() || '',
          department: departmentEl?.textContent?.trim() || '',
          description: posting.textContent?.trim()?.substring(0, 500) || '',
        });
      }
    }

    return jobs;
  }, config.boardUrl);
}

async function extractGenericJobs(page: Page, config: CompanyConfig): Promise<RawScrapedJob[]> {
  const { selectors } = config;

  return page.evaluate(
    ({ selectors: sel, boardUrl }: { selectors: typeof selectors; boardUrl: string }) => {
      const jobs: RawScrapedJob[] = [];
      const containers = document.querySelectorAll(sel.jobList);

      for (const container of containers) {
        const titleEl = container.querySelector(sel.jobTitle) || container;
        const locationEl = sel.jobLocation ? container.querySelector(sel.jobLocation) : null;
        const departmentEl = sel.jobDepartment ? container.querySelector(sel.jobDepartment) : null;

        let linkEl: Element | null = null;
        if (sel.jobLink === 'self') {
          linkEl = container.closest('a') || container.querySelector('a');
        } else {
          linkEl = container.querySelector(sel.jobLink);
        }

        const title = titleEl?.textContent?.trim() || '';
        let url = linkEl?.getAttribute('href') || '';
        if (url && !url.startsWith('http')) {
          url = new URL(url, boardUrl).href;
        }

        if (title && title.length > 3 && title.length < 300) {
          jobs.push({
            title,
            url: url || boardUrl,
            location: locationEl?.textContent?.trim() || '',
            department: departmentEl?.textContent?.trim() || '',
            description: container.textContent?.trim()?.substring(0, 500) || '',
          });
        }
      }

      return jobs;
    },
    { selectors, boardUrl: config.boardUrl }
  );
}

// ─── Pagination Handlers ──────────────────────────────────────────

async function handleScrollPagination(page: Page, config: CompanyConfig): Promise<void> {
  const maxScrolls = config.pagination.maxScrolls || 10;
  const scrollDelay = config.pagination.scrollDelayMs || 1500;

  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await sleep(randomDelay(scrollDelay));

    // Check if we've hit the end (no new content)
    const isAtBottom = await page.evaluate(() => {
      return (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 200);
    });

    if (isAtBottom) break;
  }
}

// ─── Core Scrape Function ─────────────────────────────────────────

export async function scrapeCompany(
  config: CompanyConfig,
  companyId: string,
  options?: {
    dryRun?: boolean;
    onProgress?: (msg: string) => void;
  }
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const log = options?.onProgress || console.log;

  log(`🚀 Starting scrape for ${config.company} (${config.atsType})...`);
  log(`   Board URL: ${config.boardUrl}`);

  let browser: Browser | null = null;
  let allJobs: NormalizedJob[] = [];

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context: BrowserContext = await browser.newContext({
      userAgent: config.userAgentRotation ? getRandomUserAgent() : USER_AGENTS[0],
      viewport: { width: 1440, height: 900 },
    });

    const page: Page = await context.newPage();

    // Navigate to the careers board
    log(`   Navigating to board...`);
    await page.goto(config.boardUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for content to render (especially important for SPAs)
    await sleep(randomDelay(config.requestDelayMs || 2000));

    // Handle pagination if needed
    if (config.pagination.type === 'scroll') {
      log(`   Scrolling for more results...`);
      await handleScrollPagination(page, config);
    }

    // Extract jobs based on ATS type
    let rawJobs: RawScrapedJob[] = [];

    try {
      switch (config.atsType) {
        case 'greenhouse':
          rawJobs = await extractGreenhouseJobs(page, config);
          break;
        case 'lever':
          rawJobs = await extractLeverJobs(page, config);
          break;
        case 'ashby':
          rawJobs = await extractAshbyJobs(page, config);
          break;
        default:
          rawJobs = await extractGenericJobs(page, config);
      }
    } catch (extractError) {
      const errMsg = extractError instanceof Error ? extractError.message : String(extractError);
      errors.push(`Extraction error: ${errMsg}`);
      log(`   ❌ Extraction error: ${errMsg}`);
    }

    log(`   📋 Extracted ${rawJobs.length} raw job listings`);

    // Normalize all jobs
    const seen = new Set<string>();
    for (const raw of rawJobs) {
      try {
        const normalized = normalizeJob(raw, companyId);

        // Deduplicate within this scrape run
        if (!seen.has(normalized.sourceHash)) {
          // We broaden the filter slightly so you can see actual jobs coming in!
          // We look for Frontend, React, Vue, Angular, OR general Software Engineer/Developer
          const isRelevant = /\b(frontend|front-end|react|vue|angular|ui|ux|web|software|engineer|developer)\b/i.test(normalized.title);
          
          if (normalized.remoteType === 'REMOTE' && isRelevant) {
            seen.add(normalized.sourceHash);
            allJobs.push(normalized);
          }
        }
      } catch (normError) {
        const errMsg = normError instanceof Error ? normError.message : String(normError);
        errors.push(`Normalization error for "${raw.title}": ${errMsg}`);
      }
    }

    log(`   ✅ Normalized ${allJobs.length} unique jobs (${rawJobs.length - allJobs.length} duplicates removed)`);

    await browser.close();
    browser = null;

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Fatal scrape error: ${errMsg}`);
    log(`   ❌ Fatal error: ${errMsg}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const duration = Date.now() - startTime;
  log(`   ⏱️  Completed in ${(duration / 1000).toFixed(1)}s`);

  if (errors.length > 0) {
    log(`   ⚠️  ${errors.length} error(s) occurred`);
  }

  return {
    company: config.company,
    jobs: allJobs,
    errors,
    totalFound: allJobs.length,
    duration,
  };
}

// ─── Config Loader ────────────────────────────────────────────────

export function loadCompanyConfig(configPath: string): CompanyConfig {
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as CompanyConfig;
}

export function loadAllConfigs(configDir?: string): CompanyConfig[] {
  const dir = configDir || path.join(process.cwd(), 'scraper', 'configs');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => loadCompanyConfig(path.join(dir, f)));
}

// ─── CLI Entry Point ──────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const companySlug = args.find(a => a.startsWith('--company='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');

  async function main() {
    const configs = loadAllConfigs();

    const targets = companySlug
      ? configs.filter(c => c.slug === companySlug)
      : configs;

    if (targets.length === 0) {
      console.error(`No config found for company: ${companySlug}`);
      console.log(`Available: ${configs.map(c => c.slug).join(', ')}`);
      process.exit(1);
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Job Portal Scraper — ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`  Targets: ${targets.map(t => t.company).join(', ')}`);
    console.log(`${'═'.repeat(60)}\n`);

    let allScrapedJobs: NormalizedJob[] = [];

    for (const config of targets) {
      const result = await scrapeCompany(config, config.slug, {
        dryRun,
        onProgress: console.log,
      });

      allScrapedJobs.push(...result.jobs);

      console.log(`\n--- ${config.company} Results ---`);
      console.log(`Jobs found: ${result.totalFound}`);
      console.log(`Errors: ${result.errors.length}`);
      console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);

      if (dryRun && result.jobs.length > 0) {
        console.log(`\nSample jobs:`);
        for (const job of result.jobs.slice(0, 5)) {
          console.log(`  • ${job.title}`);
          console.log(`    Location: ${job.city || 'N/A'}, ${job.country || 'N/A'} (${job.remoteType})`);
          console.log(`    Level: ${job.experienceLevel || 'N/A'} | Type: ${job.employmentType}`);
          console.log(`    URL: ${job.applyUrl}`);
          console.log();
        }
      }
    }

    if (!dryRun) {
      const outputPath = path.join(process.cwd(), 'public', 'data', 'jobs.json');
      let existingJobs: NormalizedJob[] = [];
      try {
        if (fs.existsSync(outputPath)) {
          existingJobs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        }
      } catch (e) {
        console.warn('Could not read existing jobs.json, starting fresh.');
      }
      
      const combined = [...existingJobs, ...allScrapedJobs];
      // Deduplicate by sourceHash
      const uniqueJobs = Array.from(new Map(combined.map(j => [j.sourceHash, j])).values());
      
      fs.writeFileSync(outputPath, JSON.stringify(uniqueJobs, null, 2));
      console.log(`\nSaved ${uniqueJobs.length} total unique remote frontend jobs to ${outputPath}`);
    }
  }

  main().catch(console.error);
}
