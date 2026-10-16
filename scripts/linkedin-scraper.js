#!/usr/bin/env node
/**
 * Remote Frontend Developer Job Scraper (Pure HTTP / No Playwright)
 * 
 * Sources & Exact Filters:
 * 1. LinkedIn Guest API: Strictly Remote (f_WT=2), DD sort, extracts full HTML descriptions,
 *    queries Global/Worldwide + ALL 205 countries with state-tracking & 429 backoff.
 * 2. Remotive: ?category=software-dev&search=front%20end & ?search=frontend
 * 3. Remote OK: ?tag=react, ?tag=frontend & base /api
 * 4. Himalayas: https://himalayas.app/jobs/api with client-side filtering on title & categories
 * 5. Jobicy: ?tag=react, ?tag=frontend, & ?industry=dev
 * 6. Arbeitnow: https://www.arbeitnow.com/api/job-board-api with client-side filtering on remote=true & title
 * 7. We Work Remotely: Front-End programming category RSS feed
 * 8. RemoteFirstJobs: ?query=frontend
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

const MAX_PAGES = parseInt(process.env.MAX_PAGES || '2', 10);
const SLEEP_MS = 400;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Targeted job IDs / slugs to strictly permanently exclude
const BLOCKED_TARGETS = [
  '58c63410',
  'eb615191',
  '1d9d3706'
];

// All 205 countries in the world + Global/Worldwide
const ALL_COUNTRIES = [
  '', // Global / All
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const TARGET_LOCATIONS = (process.env.COUNTRY || process.argv[2])
  ? [process.env.COUNTRY || process.argv[2]]
  : ALL_COUNTRIES;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

// ─── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        processedJobIds: Array.isArray(data.processedJobIds) ? data.processedJobIds : [],
        completedCountries: Array.isArray(data.completedCountries) ? data.completedCountries : []
      };
    } catch (_) {}
  }
  return { processedJobIds: [], completedCountries: [] };
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
    if (res.status === 429) {
      return { status: 429, text: '' };
    }
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

// ─── Source 1: LinkedIn Guest API (All Countries) ─────────────────────
async function scrapeLinkedIn(jobs, existingApplyUrls, existingHashes, state) {
  console.log(`\n💼 [1/8] Scraping LinkedIn Guest API across ${TARGET_LOCATIONS.length} locations (Strict Remote Frontend)...`);
  let added = 0;

  for (let i = 0; i < TARGET_LOCATIONS.length; i++) {
    const loc = TARGET_LOCATIONS[i];
    const locName = loc || 'Global (Worldwide)';

    // Skip already completed countries in state
    if (state.completedCountries && state.completedCountries.includes(loc)) {
      continue;
    }

    console.log(`\n  🔎 [${i + 1}/${TARGET_LOCATIONS.length}] LinkedIn Search: "${locName}"`);

    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * 10;
      const searchUrl = new URL('https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search');
      searchUrl.searchParams.set('keywords', 'frontend developer');
      if (loc) searchUrl.searchParams.set('location', loc);
      searchUrl.searchParams.set('f_WT', '2'); // Remote strictly
      searchUrl.searchParams.set('sortBy', 'DD'); // Most recent
      searchUrl.searchParams.set('start', start.toString());

      let res = await fetchSafeText(searchUrl.toString());

      // If 429 rate limit hit, backoff and retry once
      if (res.status === 429) {
        console.log(`    ⏳ Rate limited (429) on "${locName}". Backing off for 3.5s...`);
        await sleep(3500);
        res = await fetchSafeText(searchUrl.toString());
      }

      const html = res.text;
      if (!html || html.length < 500) break;

      const jobIds = [...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)].map(m => m[1]);
      if (jobIds.length === 0) break;

      console.log(`    📄 Page ${page + 1}: Found ${jobIds.length} job cards`);

      for (const id of jobIds) {
        if (state.processedJobIds.includes(id)) continue;

        await sleep(SLEEP_MS);
        const detailUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`;
        let detailRes = await fetchSafeText(detailUrl);

        if (detailRes.status === 429) {
          await sleep(3000);
          detailRes = await fetchSafeText(detailUrl);
        }

        const detailHtml = detailRes.text;
        if (!detailHtml) {
          state.processedJobIds.push(id);
          continue;
        }

        const titleMatch = detailHtml.match(/<h2[^>]*class="[^"]*topcard__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
                           detailHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const companyMatch = detailHtml.match(/<a[^>]*data-tracking-control-name="public_jobs_topcard-org-name"[^>]*>([\s\S]*?)<\/a>/i) ||
                             detailHtml.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const locMatch = detailHtml.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const logoMatch = detailHtml.match(/<img[^>]*class="[^"]*artdeco-entity-image[^"]*"[^>]*data-delayed-url="([^"]+)"/i) ||
                          detailHtml.match(/<img[^>]*class="[^"]*artdeco-entity-image[^"]*"[^>]*src="([^"]+)"/i);
        const descMatch = detailHtml.match(/<div class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const company = companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : (loc || 'Remote');
        const logo = logoMatch ? logoMatch[1].replace(/&amp;/g, '&') : '';
        const description = descMatch ? descMatch[1] : '';

        // Avoid on-site/hybrid
        const topcard = (detailHtml.match(/<section class="top-card-layout[\s\S]*?<\/section>/i) || [])[0] || '';
        if (/\b(on-site|onsite|hybrid)\b/i.test(topcard) && !/\bremote\b/i.test(topcard)) {
          state.processedJobIds.push(id);
          continue;
        }

        const applyUrl = `https://www.linkedin.com/jobs/view/${id}/`;

        const saved = buildAndSaveJob({
          title,
          companyName: company,
          applyUrl,
          description,
          location,
          country: loc || 'Global',
          logoUrl: logo,
          postedAt: new Date().toISOString()
        }, jobs, existingApplyUrls, existingHashes, state, id);

        if (saved) {
          added++;
          console.log(`      ✅ Saved: ${title} @ ${company} (${location})`);
        } else {
          state.processedJobIds.push(id);
        }
      }
    }

    // Mark country completed
    if (state.completedCountries) {
      state.completedCountries.push(loc);
      saveState(state);
    }

    await sleep(250);
  }

  // If all completed, reset for next scheduled run
  if (state.completedCountries && state.completedCountries.length >= TARGET_LOCATIONS.length) {
    state.completedCountries = [];
    saveState(state);
  }

  console.log(`  ✨ LinkedIn Guest completed. Added ${added} new jobs.`);
  return added;
}

// ─── Source 2: Remotive API ───────────────────────────────────────────
async function scrapeRemotive(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [2/8] Scraping Remotive API (?category=software-dev&search=front%20end)...');
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

// ─── Source 3: Remote OK API ──────────────────────────────────────────
async function scrapeRemoteOK(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [3/8] Scraping Remote OK API (?tag=react, ?tag=frontend, & base /api)...');
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

// ─── Source 4: Himalayas API ──────────────────────────────────────────
async function scrapeHimalayas(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [4/8] Scraping Himalayas API (Client-side title & category filter)...');
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

// ─── Source 5: Jobicy API ─────────────────────────────────────────────
async function scrapeJobicy(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [5/8] Scraping Jobicy API (?tag=react, ?tag=frontend, & ?industry=dev)...');
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

// ─── Source 6: Arbeitnow API ──────────────────────────────────────────
async function scrapeArbeitnow(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [6/8] Scraping Arbeitnow API (Client-side remote=true & title filter)...');
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
  console.log('\n🌐 [7/8] Scraping WeWorkRemotely RSS Feed (Front-end category)...');
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

// ─── Source 8: RemoteFirstJobs API ────────────────────────────────────
async function scrapeRemoteFirstJobs(jobs, existingApplyUrls, existingHashes, state) {
  console.log('\n🌐 [8/8] Scraping RemoteFirstJobs API (?query=frontend)...');
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

// ─── Main Orchestrator ────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log('🚀 Starting Multi-Source Remote Frontend Job Scraper');
  console.log(`⚙️  Config: MAX_PAGES=${MAX_PAGES}, LinkedIn scanning all ${TARGET_LOCATIONS.length} countries, 8 total sources`);
  console.log('═'.repeat(60));

  const state = loadState();
  const jobs = loadJobs();
  const initialCount = jobs.length;

  console.log(`📋 Loaded ${initialCount} active jobs (<= 30 days old).`);

  const existingApplyUrls = new Set(jobs.map((j) => j.applyUrl));
  const existingHashes = new Set(jobs.map((j) => j.sourceHash));

  // Run all 8 sources sequentially
  await scrapeLinkedIn(jobs, existingApplyUrls, existingHashes, state);
  await scrapeRemotive(jobs, existingApplyUrls, existingHashes, state);
  await scrapeRemoteOK(jobs, existingApplyUrls, existingHashes, state);
  await scrapeHimalayas(jobs, existingApplyUrls, existingHashes, state);
  await scrapeJobicy(jobs, existingApplyUrls, existingHashes, state);
  await scrapeArbeitnow(jobs, existingApplyUrls, existingHashes, state);
  await scrapeWeWorkRemotely(jobs, existingApplyUrls, existingHashes, state);
  await scrapeRemoteFirstJobs(jobs, existingApplyUrls, existingHashes, state);

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
