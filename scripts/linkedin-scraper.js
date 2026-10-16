#!/usr/bin/env node
/**
 * Multi-Source Remote Frontend Developer Job Scraper
 * (LinkedIn Scraper Removed - Strictly Remote Job APIs Only)
 * 
 * Verified Remote APIs:
 * 1. RemoteFirstJobs API: ?query=frontend
 * 2. Remote OK API: ?tag=react, ?tag=frontend, & base /api
 * 3. Jobicy API: ?tag=react, ?tag=frontend, & ?industry=dev
 * 4. Remotive API: ?category=software-dev&search=front%20end & ?search=frontend
 * 5. Himalayas API: https://himalayas.app/jobs/api (client-side title & category filter)
 * 6. Arbeitnow API: https://www.arbeitnow.com/api/job-board-api (client-side remote=true & title filter)
 * 7. We Work Remotely: Front-End programming category RSS feed
 * 
 * Strict Frontend Filtering:
 * - Title MUST match frontend (/front[\s-]*end/i)
 * - Title MUST NOT match Full Stack (/full[\s-]*stack|fullstack/i)
 * - Title MUST NOT match Backend (/back[\s-]*end|backend/i)
 * - MUST NOT be Hybrid or On-site (/hybrid|on-site|onsite|relocation provided/i)
 * - Age <= 30 days
 * - Auto-enriches all new jobs with fast regex metadata
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { extractTags } = require('./enrich-jobs-ai.js');

// ─── Config & Paths ───────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, '..', 'data', 'jobs.json');
const STATE_FILE = path.join(__dirname, '..', 'data', 'scraper-state.json');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Targeted job IDs / slugs to strictly permanently exclude
const BLOCKED_TARGETS = [
  '58c63410',
  'eb615191',
  '1d9d3706'
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

// ─── Helpers ──────────────────────────────────────────────────────────
function generateId(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function generateSlug(title, company, id) {
  const cleanTitle = (title || 'frontend-developer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const cleanCompany = (company || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${cleanTitle}-${cleanCompany}-${(id || '').substring(0, 8)}`;
}

function cleanHtmlText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Strict filtering rules:
 * 1. Title MUST have "frontend" / "front-end" / "front end"
 * 2. Title MUST NOT contain "full stack", "fullstack", "backend", "back end"
 * 3. Title or Location MUST NOT contain "hybrid", "on-site", "onsite", "relocation provided"
 * 4. Must not match blocked IDs/slugs
 */
function isStrictFrontend(title, location = '', description = '', checkId = '') {
  if (!title) return false;
  const t = title.toLowerCase();

  // Check blocked targets
  if (checkId && BLOCKED_TARGETS.some(b => checkId.includes(b))) return false;

  // 1. MUST contain frontend
  if (!/front[\s-]*end/i.test(t)) {
    return false;
  }

  // 2. Negative filter: NO Full Stack or Backend in title
  if (/\b(full[\s-]*stack|fullstack|back[\s-]*end|backend)\b/i.test(t)) {
    return false;
  }

  // 3. Negative filter: NO On-site / Hybrid / Relocation in title
  if (/\b(hybrid|on-site|onsite|relocation\s+provided|in-office)\b/i.test(t)) {
    return false;
  }

  // 4. Check location string if provided
  if (location) {
    const loc = location.toLowerCase();
    if (/\b(on-site|onsite|hybrid|in-office)\b/i.test(loc)) {
      return false;
    }
  }

  return true;
}

// ─── State & Database Management ──────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return {
        processedJobIds: Array.isArray(data.processedJobIds) ? data.processedJobIds : []
      };
    } catch (_) {}
  }
  return { processedJobIds: [] };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (_) {}
}

function loadJobs() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const now = Date.now();
      return raw.filter((j) => {
        const t = new Date(j.postedAt).getTime();
        return !isNaN(t) && (now - t) <= THIRTY_DAYS_MS;
      });
    } catch (_) {}
  }
  return [];
}

function saveJobs(jobs) {
  const now = Date.now();
  const fresh = jobs.filter((j) => {
    const t = new Date(j.postedAt).getTime();
    return !isNaN(t) && (now - t) <= THIRTY_DAYS_MS;
  });
  fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2) + '\n');
}

// ─── Job Normalizer & Saver ───────────────────────────────────────────
function buildAndSaveJob({
  title,
  companyName,
  applyUrl,
  description,
  location,
  country,
  logoUrl,
  postedAt
}, jobs, existingApplyUrls, existingHashes, state, sourceJobId = '') {
  if (!isStrictFrontend(title, location, description, sourceJobId || applyUrl)) {
    return false;
  }

  const cleanUrl = applyUrl.trim();
  const sourceHash = generateId(cleanUrl);

  if (existingApplyUrls.has(cleanUrl) || existingHashes.has(sourceHash)) {
    return false;
  }

  const cleanTitle = title.trim();
  const cleanCompany = (companyName || 'Technology Company').trim();
  const companyDomain = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const jobSlug = generateSlug(cleanTitle, cleanCompany, sourceHash);

  const finalLocation = location ? (location.toLowerCase().includes('remote') ? location : `Remote - ${location}`) : 'Remote - Global';
  const finalCountry = country || 'Global';

  const newJob = {
    id: sourceHash,
    title: cleanTitle,
    applyUrl: cleanUrl,
    description: description ? cleanHtmlText(description) : '',
    location: finalLocation,
    country: finalCountry,
    remoteType: 'REMOTE',
    postedAt: postedAt ? new Date(postedAt).toISOString() : new Date().toISOString(),
    sourceHash: sourceHash,
    company: {
      id: companyDomain.split('.')[0] || 'company',
      name: cleanCompany,
      logoUrl: logoUrl || `https://logo.clearbit.com/${companyDomain}`,
      industry: 'Technology',
      website: `https://${companyDomain}`
    },
    slug: jobSlug
  };

  newJob.aiTags = extractTags(newJob);

  jobs.unshift(newJob);
  existingApplyUrls.add(cleanUrl);
  existingHashes.add(sourceHash);
  if (sourceJobId && state && Array.isArray(state.processedJobIds)) {
    state.processedJobIds.push(sourceJobId);
  }

  return true;
}

// ─── Network Helpers ──────────────────────────────────────────────────
async function fetchSafeText(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, ...(options.headers || {}) },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return { status: res.status, text: '' };
    const text = await res.text();
    return { status: 200, text };
  } catch (_) {
    return { status: 0, text: '' };
  }
}

async function fetchSafeJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, ...(options.headers || {}) },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

// ─── Source 1: RemoteFirstJobs API ────────────────────────────────────
async function scrapeRemoteFirstJobs(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [1/7] Scraping RemoteFirstJobs API (?query=frontend)...');
  let added = 0;
  try {
    const data = await fetchSafeJson('https://remotefirstjobs.com/api/search-jobs?query=frontend');
    if (!data || !Array.isArray(data.jobs)) return 0;

    for (const job of data.jobs) {
      const title = job.title || '';
      const company = job.company_name || '';
      const applyUrl = job.url || '';
      const description = job.description || job.body || '';
      const location = Array.isArray(job.locations) && job.locations.length > 0 ? job.locations.join(', ') : 'Global';
      const logo = job.company_logo || '';
      const publishedAt = job.published_at || '';

      const saved = buildAndSaveJob({
        title,
        companyName: company,
        applyUrl,
        description,
        location,
        country: location,
        logoUrl: logo,
        postedAt: publishedAt
      }, jobs, existingApplyUrls, existingHashes, state);

      if (saved) {
        added++;
        console.log(`  ✅ Saved: ${title} @ ${company}`);
      }
    }
  } catch (err) {
    console.log(`  ⚠️ RemoteFirstJobs error: ${err.message}`);
  }
  console.log(`  ✨ RemoteFirstJobs completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 2: Remote OK API ──────────────────────────────────────────
async function scrapeRemoteOK(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [2/7] Scraping Remote OK API (?tag=react, ?tag=frontend, & base /api)...');
  let added = 0;
  const endpoints = [
    'https://remoteok.com/api?tag=react',
    'https://remoteok.com/api?tag=frontend',
    'https://remoteok.com/api'
  ];

  for (const url of endpoints) {
    try {
      const data = await fetchSafeJson(url);
      if (!Array.isArray(data)) continue;

      const list = data.slice(1);
      for (const job of list) {
        const title = job.position || '';
        const company = job.company || '';
        const applyUrl = job.apply_url || job.url || `https://remoteok.com/remote-jobs/${job.id}`;
        const description = job.description || '';
        const location = job.location || 'Global';
        const logo = job.logo || '';
        const publishedAt = job.date || '';

        const saved = buildAndSaveJob({
          title,
          companyName: company,
          applyUrl,
          description,
          location,
          country: location,
          logoUrl: logo,
          postedAt: publishedAt
        }, jobs, existingApplyUrls, existingHashes, state);

        if (saved) {
          added++;
          console.log(`  ✅ Saved: ${title} @ ${company}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️ RemoteOK error for ${url}: ${err.message}`);
    }
  }
  console.log(`  ✨ RemoteOK completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 3: Jobicy API ─────────────────────────────────────────────
async function scrapeJobicy(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [3/7] Scraping Jobicy API (?tag=react, ?tag=frontend, & ?industry=dev)...');
  let added = 0;
  const endpoints = [
    'https://jobicy.com/api/v2/remote-jobs?count=50&tag=frontend',
    'https://jobicy.com/api/v2/remote-jobs?count=50&tag=react',
    'https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev'
  ];

  for (const url of endpoints) {
    try {
      const data = await fetchSafeJson(url);
      if (!data || !Array.isArray(data.jobs)) continue;

      for (const job of data.jobs) {
        const title = job.jobTitle || '';
        const company = job.companyName || '';
        const applyUrl = job.url || '';
        const description = job.jobDescription || '';
        const location = job.jobGeo || 'Global';
        const logo = job.companyLogo || '';
        const publishedAt = job.pubDate || '';

        const saved = buildAndSaveJob({
          title,
          companyName: company,
          applyUrl,
          description,
          location,
          country: location,
          logoUrl: logo,
          postedAt: publishedAt
        }, jobs, existingApplyUrls, existingHashes, state);

        if (saved) {
          added++;
          console.log(`  ✅ Saved: ${title} @ ${company}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️ Jobicy error for ${url}: ${err.message}`);
    }
  }
  console.log(`  ✨ Jobicy completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 4: Remotive API ───────────────────────────────────────────
async function scrapeRemotive(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [4/7] Scraping Remotive API (?category=software-dev&search=front%20end)...');
  let added = 0;
  const endpoints = [
    'https://remotive.com/api/remote-jobs?category=software-dev&search=front%20end',
    'https://remotive.com/api/remote-jobs?search=frontend'
  ];

  for (const url of endpoints) {
    try {
      const data = await fetchSafeJson(url);
      if (!data || !Array.isArray(data.jobs)) continue;

      for (const job of data.jobs) {
        const title = job.title || '';
        const company = job.company_name || '';
        const applyUrl = job.url || '';
        const description = job.description || '';
        const location = job.candidate_required_location || 'Worldwide';
        const logo = job.company_logo || '';
        const publishedAt = job.publication_date || '';

        const saved = buildAndSaveJob({
          title,
          companyName: company,
          applyUrl,
          description,
          location,
          country: location,
          logoUrl: logo,
          postedAt: publishedAt
        }, jobs, existingApplyUrls, existingHashes, state);

        if (saved) {
          added++;
          console.log(`  ✅ Saved: ${title} @ ${company}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️ Remotive error for ${url}: ${err.message}`);
    }
  }
  console.log(`  ✨ Remotive completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 5: Himalayas API ──────────────────────────────────────────
async function scrapeHimalayas(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [5/7] Scraping Himalayas API (Client-side title & category filter)...');
  let added = 0;
  try {
    let cursor = '';
    for (let page = 0; page < 3; page++) {
      const url = cursor
        ? `https://himalayas.app/jobs/api?cursor=${cursor}`
        : `https://himalayas.app/jobs/api`;
      
      const data = await fetchSafeJson(url);
      if (!data || !Array.isArray(data.jobs) || data.jobs.length === 0) break;

      for (const job of data.jobs) {
        const title = job.title || '';
        const company = job.companyName || '';
        const applyUrl = job.applicationLink || job.guid || '';
        const description = job.description || job.excerpt || '';
        const location = Array.isArray(job.locationRestrictions) && job.locationRestrictions.length > 0
          ? job.locationRestrictions.join(', ')
          : 'Worldwide';
        const logo = job.companyLogo || '';
        const publishedAt = job.pubDate ? new Date(job.pubDate * 1000).toISOString() : '';

        const saved = buildAndSaveJob({
          title,
          companyName: company,
          applyUrl,
          description,
          location,
          country: location,
          logoUrl: logo,
          postedAt: publishedAt
        }, jobs, existingApplyUrls, existingHashes, state);

        if (saved) {
          added++;
          console.log(`  ✅ Saved: ${title} @ ${company}`);
        }
      }

      cursor = data.nextCursor;
      if (!cursor) break;
    }
  } catch (err) {
    console.log(`  ⚠️ Himalayas error: ${err.message}`);
  }
  console.log(`  ✨ Himalayas completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 6: Arbeitnow API ──────────────────────────────────────────
async function scrapeArbeitnow(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [6/7] Scraping Arbeitnow API (Client-side remote=true & title filter)...');
  let added = 0;
  try {
    const data = await fetchSafeJson('https://www.arbeitnow.com/api/job-board-api');
    if (!data || !Array.isArray(data.data)) return 0;

    for (const job of data.data) {
      if (job.remote !== true) continue;

      const title = job.title || '';
      const company = job.company_name || '';
      const applyUrl = job.url || '';
      const description = job.description || '';
      const location = job.location || 'Remote';
      const publishedAt = job.created_at ? new Date(job.created_at * 1000).toISOString() : '';

      const saved = buildAndSaveJob({
        title,
        companyName: company,
        applyUrl,
        description,
        location,
        country: location,
        logoUrl: '',
        postedAt: publishedAt
      }, jobs, existingApplyUrls, existingHashes, state);

      if (saved) {
        added++;
        console.log(`  ✅ Saved: ${title} @ ${company}`);
      }
    }
  } catch (err) {
    console.log(`  ⚠️ Arbeitnow error: ${err.message}`);
  }
  console.log(`  ✨ Arbeitnow completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 7: WeWorkRemotely RSS ─────────────────────────────────────
async function scrapeWeWorkRemotely(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [7/7] Scraping WeWorkRemotely RSS Feed (Front-end category)...');
  let added = 0;
  try {
    const res = await fetchSafeText('https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss');
    const xml = res.text;
    if (!xml) return 0;

    const items = xml.split('<item>').slice(1);
    for (const item of items) {
      const rawTitle = (item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
      const link = (item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';
      const region = (item.match(/<region>([\s\S]*?)<\/region>/i) || [])[1] || 'Worldwide';
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);
      const description = descMatch ? descMatch[1] : '';

      let company = '';
      let title = rawTitle;
      if (rawTitle.includes(':')) {
        const parts = rawTitle.split(':');
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      const saved = buildAndSaveJob({
        title,
        companyName: company,
        applyUrl: link.trim(),
        description,
        location: region.trim(),
        country: region.trim(),
        logoUrl: '',
        postedAt: pubDate
      }, jobs, existingApplyUrls, existingHashes, state);

      if (saved) {
        added++;
        console.log(`  ✅ Saved: ${title} @ ${company}`);
      }
    }
  } catch (err) {
    console.log(`  ⚠️ WeWorkRemotely error: ${err.message}`);
  }
  console.log(`  ✨ WeWorkRemotely completed. Added ${added} new jobs.`);
  return added;
}

// ─── Main Orchestrator ────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log('🚀 Starting Multi-Source Remote Frontend Job Scraper');
  console.log('⚙️  LinkedIn scraper removed. Querying 7 verified remote APIs.');
  console.log('═'.repeat(60));

  const state = loadState();
  const jobs = loadJobs();
  const initialCount = jobs.length;

  console.log(`📋 Loaded ${initialCount} active jobs (<= 30 days old).`);

  const existingApplyUrls = new Set(jobs.map((j) => j.applyUrl));
  const existingHashes = new Set(jobs.map((j) => j.sourceHash));

  // Run all 7 remote API sources sequentially
  await scrapeRemoteFirstJobs(jobs, existingApplyUrls, existingHashes, state);
  await scrapeRemoteOK(jobs, existingApplyUrls, existingHashes, state);
  await scrapeJobicy(jobs, existingApplyUrls, existingHashes, state);
  await scrapeRemotive(jobs, existingApplyUrls, existingHashes, state);
  await scrapeHimalayas(jobs, existingApplyUrls, existingHashes, state);
  await scrapeArbeitnow(jobs, existingApplyUrls, existingHashes, state);
  await scrapeWeWorkRemotely(jobs, existingApplyUrls, existingHashes, state);

  // Persist fresh jobs & state
  saveJobs(jobs);
  saveState(state);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const newJobsCount = jobs.length - initialCount;

  console.log('\n' + '═'.repeat(60));
  console.log(`🎉 Scraping finished in ${durationSec}s!`);
  console.log(`📊 Initial jobs: ${initialCount} | New jobs added: ${newJobsCount} | Total jobs now: ${jobs.length}`);
}

main().catch((err) => {
  console.error('Fatal Scraper Error:', err);
  process.exit(1);
});
