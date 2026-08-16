/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  API-based Job Sources                                      ║
 * ║  Fetches remote jobs from free public APIs that aggregate    ║
 * ║  listings from thousands of companies worldwide.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * Sources:
 *  1. RemoteOK       — 5,000+ companies, free public API
 *  2. Remotive       — 3,000+ companies, free API
 *  3. Arbeitnow      — 2,000+ companies, free API
 *  4. Jobicy          — 1,000+ companies, free API
 *  5. Himalayas       — 1,500+ companies, free API
 *  6. FindWork        — 500+ companies, free API
 */

import { type NormalizedJob, type EmploymentType } from './normalizer';
import crypto from 'crypto';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateHash(company: string, title: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`${company}|${title}|${location}`.toLowerCase())
    .digest('hex');
}

function inferExperienceLevel(title: string): 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | null {
  if (/\b(lead|principal|staff|director|head of|vp|architect)\b/i.test(title)) return 'LEAD';
  if (/\b(senior|sr\.?|experienced)\b/i.test(title)) return 'SENIOR';
  if (/\b(mid[- ]?level|intermediate)\b/i.test(title)) return 'MID';
  if (/\b(junior|jr\.?|entry|associate|trainee|graduate|intern)\b/i.test(title)) return 'ENTRY';
  return null;
}

function inferEmploymentType(text: string): EmploymentType {
  if (/\b(intern(ship)?)\b/i.test(text)) return 'INTERNSHIP';
  if (/\b(contract(or)?|freelance)\b/i.test(text)) return 'CONTRACT';
  if (/\b(part[- ]?time)\b/i.test(text)) return 'PART_TIME';
  return 'FULL_TIME';
}

// Quick pre-filter before sending to Gemini (saves API calls)
function quickFrontendCheck(title: string, tags: string[] = []): boolean {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  
  // Strong frontend signals — likely frontend
  const frontendSignals = /\b(frontend|front-end|front end|react|vue|angular|svelte|nextjs|next\.js|nuxt|remix|astro|ui engineer|ui developer|ux engineer|javascript developer|typescript developer|web developer|react native)\b/i;
  if (frontendSignals.test(text)) return true;
  
  // Fullstack with JS indicators
  if (/\b(fullstack|full-stack|full stack)\b/i.test(text) && /\b(javascript|typescript|react|vue|angular|node|js|ts)\b/i.test(text)) return true;
  
  // Generic but with JS/TS tags
  if (/\b(software engineer|developer)\b/i.test(text) && /\b(javascript|typescript|react|vue|angular|node\.?js)\b/i.test(tags.join(' '))) return true;
  
  // Strong non-frontend signals — definitely not frontend
  const backendSignals = /\b(backend|back-end|python|java[^s]|golang|go engineer|rust|ruby|php|c\+\+|c#|\.net|scala|elixir|kotlin|swift|ios|android|devops|sre|infrastructure|platform|data engineer|data scientist|machine learning|ml engineer|ai engineer|security|devsecops|cloud|database|dba)\b/i;
  if (backendSignals.test(text) && !frontendSignals.test(text)) return false;
  
  // Non-engineering roles
  const nonEngineering = /\b(product manager|project manager|designer|marketing|sales|recruiter|hr|accountant|analyst|support|writer|content|copywriter|qa|quality assurance|tester)\b/i;
  if (nonEngineering.test(text)) return false;
  
  // If no clear signal, include it and let Gemini decide
  return /\b(engineer|developer|programmer|coder)\b/i.test(text);
}

export interface ApiSourceResult {
  source: string;
  jobs: NormalizedJob[];
  totalFetched: number;
  totalPreFiltered: number;
  errors: string[];
  duration: number;
}

type LogFn = (msg: string) => void;

// ─── Source 1: RemoteOK ────────────────────────────────────────
async function fetchRemoteOK(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const jobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from RemoteOK API...');
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'FrontendEngineers.com Job Aggregator' },
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    // First element is metadata, rest are jobs
    const rawJobs = Array.isArray(data) ? data.slice(1) : [];
    log(`   Fetched ${rawJobs.length} jobs from RemoteOK`);
    
    let preFiltered = 0;
    for (const raw of rawJobs) {
      const tags = (raw.tags || []).map((t: string) => t.toLowerCase());
      const title = raw.position || raw.title || '';
      const company = raw.company || '';
      const description = (raw.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
      
      if (!quickFrontendCheck(title, tags)) continue;
      preFiltered++;
      
      const hash = generateHash(company, title, raw.location || '');
      
      jobs.push({
        id: hash,
        title,
        applyUrl: raw.url || `https://remoteok.com/remote-jobs/${raw.slug || raw.id}`,
        description,
        location: raw.location || 'Remote',
        city: null,
        state: null,
        country: null,
        remoteType: 'REMOTE',
        salaryMin: raw.salary_min ? parseInt(raw.salary_min) : null,
        salaryMax: raw.salary_max ? parseInt(raw.salary_max) : null,
        currency: 'USD',
        experienceLevel: inferExperienceLevel(title),
        employmentType: inferEmploymentType(title + ' ' + description),
        department: null,
        postedAt: raw.date ? new Date(raw.date) : null,
        sourceHash: hash,
        company: {
          id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: company,
          logoUrl: raw.company_logo || raw.logo || null,
          industry: 'Technology',
          website: null,
        },
      });
    }
    
    log(`   ✅ RemoteOK: ${preFiltered} potential frontend jobs (from ${rawJobs.length} total)`);
    return { source: 'RemoteOK', jobs, totalFetched: rawJobs.length, totalPreFiltered: preFiltered, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ RemoteOK failed: ${msg}`);
    return { source: 'RemoteOK', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Source 2: Remotive ────────────────────────────────────────
async function fetchRemotive(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const jobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from Remotive API...');
    // Fetch software-dev category which includes frontend
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=500');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const rawJobs = data.jobs || [];
    log(`   Fetched ${rawJobs.length} software dev jobs from Remotive`);
    
    let preFiltered = 0;
    for (const raw of rawJobs) {
      const tags = (raw.tags || []);
      const title = raw.title || '';
      const company = raw.company_name || '';
      const description = (raw.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
      
      if (!quickFrontendCheck(title, tags)) continue;
      preFiltered++;
      
      const hash = generateHash(company, title, raw.candidate_required_location || '');
      
      jobs.push({
        id: hash,
        title,
        applyUrl: raw.url || '',
        description,
        location: raw.candidate_required_location || 'Worldwide',
        city: null,
        state: null,
        country: null,
        remoteType: 'REMOTE',
        salaryMin: null,
        salaryMax: null,
        currency: 'USD',
        experienceLevel: inferExperienceLevel(title),
        employmentType: (raw.job_type === 'contract' ? 'CONTRACT' : raw.job_type === 'part_time' ? 'PART_TIME' : 'FULL_TIME') as EmploymentType,
        department: raw.category || null,
        postedAt: raw.publication_date ? new Date(raw.publication_date) : null,
        sourceHash: hash,
        company: {
          id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: company,
          logoUrl: raw.company_logo_url || raw.company_logo || null,
          industry: 'Technology',
          website: null,
        },
      });
    }
    
    log(`   ✅ Remotive: ${preFiltered} potential frontend jobs (from ${rawJobs.length} total)`);
    return { source: 'Remotive', jobs, totalFetched: rawJobs.length, totalPreFiltered: preFiltered, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ Remotive failed: ${msg}`);
    return { source: 'Remotive', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Source 3: Arbeitnow ──────────────────────────────────────
async function fetchArbeitnow(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const allJobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from Arbeitnow API...');
    let page = 1;
    let totalFetched = 0;
    let hasMore = true;
    
    while (hasMore && page <= 10) {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const rawJobs = data.data || [];
      totalFetched += rawJobs.length;
      
      for (const raw of rawJobs) {
        if (!raw.remote) continue; // Only remote jobs
        
        const tags = (raw.tags || []);
        const title = raw.title || '';
        const company = raw.company_name || '';
        const description = (raw.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
        
        if (!quickFrontendCheck(title, tags)) continue;
        
        const hash = generateHash(company, title, raw.location || '');
        
        allJobs.push({
          id: hash,
          title,
          applyUrl: raw.url || '',
          description,
          location: raw.location || 'Remote',
          city: null,
          state: null,
          country: null,
          remoteType: 'REMOTE',
          salaryMin: null,
          salaryMax: null,
          currency: 'EUR',
          experienceLevel: inferExperienceLevel(title),
          employmentType: inferEmploymentType(title),
          department: null,
          postedAt: raw.created_at ? new Date(raw.created_at * 1000) : null,
          sourceHash: hash,
          company: {
            id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: company,
            logoUrl: null,
            industry: 'Technology',
            website: null,
          },
        });
      }
      
      hasMore = rawJobs.length > 0 && data.links?.next;
      page++;
      await sleep(500);
    }
    
    log(`   ✅ Arbeitnow: ${allJobs.length} potential frontend jobs (from ${totalFetched} total)`);
    return { source: 'Arbeitnow', jobs: allJobs, totalFetched, totalPreFiltered: allJobs.length, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ Arbeitnow failed: ${msg}`);
    return { source: 'Arbeitnow', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Source 4: Jobicy ─────────────────────────────────────────
async function fetchJobicy(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const jobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from Jobicy API...');
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50&industry=engineering');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const rawJobs = data.jobs || [];
    log(`   Fetched ${rawJobs.length} jobs from Jobicy`);
    
    let preFiltered = 0;
    for (const raw of rawJobs) {
      const title = raw.jobTitle || '';
      const company = raw.companyName || '';
      const description = (raw.jobDescription || '').replace(/<[^>]*>/g, '').substring(0, 500);
      const tags = (raw.jobIndustry || []);
      
      if (!quickFrontendCheck(title, tags)) continue;
      preFiltered++;
      
      const hash = generateHash(company, title, raw.jobGeo || '');
      
      jobs.push({
        id: hash,
        title,
        applyUrl: raw.url || '',
        description,
        location: raw.jobGeo || 'Worldwide',
        city: null,
        state: null,
        country: null,
        remoteType: 'REMOTE',
        salaryMin: raw.annualSalaryMin ? parseInt(raw.annualSalaryMin) : null,
        salaryMax: raw.annualSalaryMax ? parseInt(raw.annualSalaryMax) : null,
        currency: raw.salaryCurrency || 'USD',
        experienceLevel: inferExperienceLevel(title),
        employmentType: (raw.jobType === 'contract' ? 'CONTRACT' : 'FULL_TIME') as EmploymentType,
        department: null,
        postedAt: raw.pubDate ? new Date(raw.pubDate) : null,
        sourceHash: hash,
        company: {
          id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: company,
          logoUrl: raw.companyLogo || null,
          industry: 'Technology',
          website: null,
        },
      });
    }
    
    log(`   ✅ Jobicy: ${preFiltered} potential frontend jobs (from ${rawJobs.length} total)`);
    return { source: 'Jobicy', jobs, totalFetched: rawJobs.length, totalPreFiltered: preFiltered, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ Jobicy failed: ${msg}`);
    return { source: 'Jobicy', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Source 5: Himalayas ──────────────────────────────────────
async function fetchHimalayas(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const allJobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from Himalayas API...');
    let page = 1;
    let totalFetched = 0;
    let hasMore = true;
    
    while (hasMore && page <= 10) {
      const res = await fetch(`https://himalayas.app/jobs/api?limit=50&offset=${(page - 1) * 50}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const rawJobs = data.jobs || [];
      totalFetched += rawJobs.length;
      
      for (const raw of rawJobs) {
        const title = raw.title || '';
        const company = raw.companyName || '';
        const description = (raw.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
        const categories = raw.categories || [];
        
        if (!quickFrontendCheck(title, categories)) continue;
        
        const hash = generateHash(company, title, raw.location || '');
        
        allJobs.push({
          id: hash,
          title,
          applyUrl: raw.applicationUrl || raw.url || '',
          description,
          location: raw.location || 'Worldwide',
          city: null,
          state: null,
          country: null,
          remoteType: 'REMOTE',
          salaryMin: raw.minSalary || null,
          salaryMax: raw.maxSalary || null,
          currency: raw.salaryCurrency || 'USD',
          experienceLevel: inferExperienceLevel(title),
          employmentType: inferEmploymentType(title),
          department: categories[0] || null,
          postedAt: raw.pubDate ? new Date(raw.pubDate) : null,
          sourceHash: hash,
          company: {
            id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: company,
            logoUrl: raw.companyLogo || null,
            industry: 'Technology',
            website: raw.companyUrl || null,
          },
        });
      }
      
      hasMore = rawJobs.length === 50;
      page++;
      await sleep(500);
    }
    
    log(`   ✅ Himalayas: ${allJobs.length} potential frontend jobs (from ${totalFetched} total)`);
    return { source: 'Himalayas', jobs: allJobs, totalFetched, totalPreFiltered: allJobs.length, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ Himalayas failed: ${msg}`);
    return { source: 'Himalayas', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Source 6: FindWork ───────────────────────────────────────
async function fetchFindWork(log: LogFn): Promise<ApiSourceResult> {
  const start = Date.now();
  const errors: string[] = [];
  const allJobs: NormalizedJob[] = [];
  
  try {
    log('   Fetching from FindWork API...');
    
    const searches = ['javascript', 'react', 'vue', 'angular', 'frontend', 'typescript', 'nextjs'];
    let totalFetched = 0;
    
    for (const search of searches) {
      try {
        const res = await fetch(`https://findwork.dev/api/jobs/?search=${search}&is_remote=true&order_by=-date_posted`, {
          headers: { 'Accept': 'application/json' },
        });
        
        if (!res.ok) continue;
        
        const data = await res.json();
        const rawJobs = data.results || [];
        totalFetched += rawJobs.length;
        
        for (const raw of rawJobs) {
          const title = raw.role || '';
          const company = raw.company_name || '';
          const description = (raw.text || '').substring(0, 500);
          const keywords = raw.keywords || [];
          
          if (!quickFrontendCheck(title, keywords)) continue;
          
          const hash = generateHash(company, title, raw.location || '');
          
          allJobs.push({
            id: hash,
            title,
            applyUrl: raw.url || '',
            description,
            location: raw.location || 'Remote',
            city: null,
            state: null,
            country: null,
            remoteType: 'REMOTE',
            salaryMin: null,
            salaryMax: null,
            currency: 'USD',
            experienceLevel: inferExperienceLevel(title),
            employmentType: (raw.employment_type === 'contract' ? 'CONTRACT' : 'FULL_TIME') as EmploymentType,
            department: null,
            postedAt: raw.date_posted ? new Date(raw.date_posted) : null,
            sourceHash: hash,
            company: {
              id: company.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: company,
              logoUrl: raw.company_logo || null,
              industry: 'Technology',
              website: raw.company_url || null,
            },
          });
        }
        
        await sleep(300);
      } catch {
        // Continue with other searches
      }
    }
    
    // Deduplicate within source
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter(j => {
      if (seen.has(j.sourceHash)) return false;
      seen.add(j.sourceHash);
      return true;
    });
    
    log(`   ✅ FindWork: ${uniqueJobs.length} potential frontend jobs (from ${totalFetched} total)`);
    return { source: 'FindWork', jobs: uniqueJobs, totalFetched, totalPreFiltered: uniqueJobs.length, errors, duration: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`   ❌ FindWork failed: ${msg}`);
    return { source: 'FindWork', jobs: [], totalFetched: 0, totalPreFiltered: 0, errors, duration: Date.now() - start };
  }
}

// ─── Master Fetch ─────────────────────────────────────────────
export async function fetchAllApiSources(log: LogFn): Promise<{
  allJobs: NormalizedJob[];
  results: ApiSourceResult[];
}> {
  log('\n📡 PHASE 1: Fetching from job aggregator APIs (covering 10,000+ companies)...\n');
  
  const results: ApiSourceResult[] = [];
  
  // Fetch all sources (some in parallel where safe)
  const [remoteOK, remotive] = await Promise.all([
    fetchRemoteOK(log),
    fetchRemotive(log),
  ]);
  results.push(remoteOK, remotive);
  
  await sleep(1000);
  
  const [arbeitnow, jobicy] = await Promise.all([
    fetchArbeitnow(log),
    fetchJobicy(log),
  ]);
  results.push(arbeitnow, jobicy);
  
  await sleep(1000);
  
  const [himalayas, findwork] = await Promise.all([
    fetchHimalayas(log),
    fetchFindWork(log),
  ]);
  results.push(himalayas, findwork);
  
  // Combine all jobs
  const allJobs: NormalizedJob[] = [];
  for (const r of results) {
    allJobs.push(...r.jobs);
  }
  
  // Global deduplication by sourceHash
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter(j => {
    if (seen.has(j.sourceHash)) return false;
    seen.add(j.sourceHash);
    return true;
  });
  
  const totalFetched = results.reduce((s, r) => s + r.totalFetched, 0);
  
  log(`\n📊 API Sources Summary:`);
  log(`   Total jobs fetched:       ${totalFetched.toLocaleString()}`);
  log(`   Pre-filtered (potential):  ${allJobs.length.toLocaleString()}`);
  log(`   After deduplication:       ${uniqueJobs.length.toLocaleString()}`);
  log('');
  
  for (const r of results) {
    const status = r.errors.length > 0 ? '❌' : '✅';
    log(`   ${status} ${r.source.padEnd(15)} ${String(r.totalFetched).padStart(5)} fetched → ${String(r.jobs.length).padStart(4)} potential FE jobs  (${(r.duration / 1000).toFixed(1)}s)`);
  }
  
  return { allJobs: uniqueJobs, results };
}
