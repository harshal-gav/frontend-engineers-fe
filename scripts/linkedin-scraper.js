#!/usr/bin/env node
/**
 * LinkedIn Playwright Scraper for Remote Frontend Developer Jobs
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes LinkedIn for Remote Frontend Developer roles across prioritized countries
 * and Worldwide using authenticated session storage (`data/linkedin-auth.json`).
 * 
 * Features:
 * - Prioritized country list: Top remote tech hubs first (Worldwide, US, UK, Canada, Germany, India, etc.)
 * - Country batching & runtime caps: Prevents long-running GitHub Actions workflow timeouts
 * - Robust modal dismissal: Closes and purges artdeco modals/overlays so clicks are never intercepted
 * - Card-scoped title & metadata extraction: Fixes bug where card 1 title was wrongly assigned to all cards
 * - Strict Frontend Filtering: Requires frontend, excludes backend/fullstack/hybrid/onsite
 * - External Careers URL requirement: Excludes Easy Apply, only saves direct company career sites
 * - Auto-prunes listings older than 30 days
 * - Generates fast regex AI enrichment tags on insertion
 * 
 * Usage:
 *   node scripts/linkedin-scraper.js
 *   npm run scrape:linkedin
 *   MAX_PAGES=5 MAX_COUNTRIES=10 HEADED=true node scripts/linkedin-scraper.js
 *   COUNTRY="Germany" node scripts/linkedin-scraper.js
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { extractTags } = require("./enrich-jobs-ai.js");

// Load environment variables if running locally
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (_) {}
}

// ─── Config ───────────────────────────────────────────────────────────
const SEARCH_QUERY = "frontend developer";

// Prioritized list: Global and top remote tech markets first, followed by others
const ALL_COUNTRIES = [
  // High-yield global & top remote tech hubs
  "Worldwide",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "India",
  "Australia",
  "Netherlands",
  "France",
  "Spain",
  "Ireland",
  "Switzerland",
  "Poland",
  "Brazil",
  "Singapore",
  "Sweden",
  "Japan",
  "Israel",
  "Italy",
  "Mexico",
  "Romania",
  "Portugal",
  "Austria",
  "Denmark",
  "Norway",
  "Finland",
  "New Zealand",
  "Argentina",
  "Colombia",
  "Chile",
  "Czech Republic",
  "Belgium",
  "South Africa",
  "United Arab Emirates",
  "Estonia",
  "Greece",
  "Hungary",
  "Indonesia",
  "Malaysia",
  "Philippines",
  "Taiwan",
  "Thailand",
  "Turkey",
  "Ukraine",
  "Vietnam",
  // All remaining countries
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Armenia",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "China",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Iceland",
  "Iran",
  "Iraq",
  "Ivory Coast",
  "Jamaica",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Qatar",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Sudan",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Yemen",
  "Zambia",
];

function resolveCountries() {
  if (process.env.COUNTRIES) {
    return process.env.COUNTRIES.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (process.env.COUNTRY || process.argv[2]) {
    const raw = process.env.COUNTRY || process.argv[2];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return ALL_COUNTRIES;
}

const COUNTRIES = resolveCountries();

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "jobs.json");
const STATE_FILE = path.join(DATA_DIR, "scraper-state.json");
const AUTH_FILE = path.join(DATA_DIR, "linkedin-auth.json");

const MAX_PAGES_PER_COUNTRY = parseInt(process.env.MAX_PAGES || "5", 10);
const MAX_COUNTRIES_PER_RUN = process.env.MAX_COUNTRIES ? parseInt(process.env.MAX_COUNTRIES, 10) : Infinity;
const MAX_RUNTIME_MINUTES = process.env.MAX_RUNTIME_MINUTES ? parseInt(process.env.MAX_RUNTIME_MINUTES, 10) : Infinity;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Specific blocked job IDs / target hashes
const BLOCKED_TARGETS = [
  '58c63410',
  'eb615191',
  '1d9d3706'
];

// Wait times (ms)
const SLOW = 400;
const MEDIUM = 800;
const LONG = 1800;

// ─── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(url) {
  return crypto.createHash("sha256").update(url).digest("hex");
}

function generateSlug(title, company, id) {
  const cleanTitle = (title || "frontend-developer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const cleanCompany = (company || "company").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${cleanTitle}-${cleanCompany}-${(id || "").substring(0, 8)}`;
}

/**
 * Aggressively dismisses and purges any open modals, dialogs, overlays, or lightboxes
 * on LinkedIn (e.g. org-life-lightbox-modal, artdeco-modal, discard dialog, etc.)
 * so that clicks are never intercepted and timeouts never occur.
 */
async function dismissModals(page) {
  try {
    // 1. Press Escape to close active popups
    await page.keyboard.press("Escape").catch(() => {});

    // 2. Click visible dismiss/close/discard buttons
    const closeButtons = await page.$$(
      '#artdeco-modal-outlet button[aria-label="Dismiss"], ' +
      '#artdeco-modal-outlet button[aria-label="Close"], ' +
      '#artdeco-modal-outlet .artdeco-modal__dismiss, ' +
      '#artdeco-modal-outlet button[data-test-modal-close-btn], ' +
      '.org-life-lightbox-modal__close-button, ' +
      'button.artdeco-modal__dismiss, ' +
      'button[aria-label="Dismiss"], ' +
      'button[aria-label="Close"], ' +
      'button[data-test-dialog-secondary-btn], ' +
      'button[data-control-name="discard_application_confirm_btn"], ' +
      'button:has-text("Discard")'
    ).catch(() => []);

    for (const btn of closeButtons) {
      try {
        if (await btn.isVisible()) {
          await btn.click({ force: true, timeout: 800 }).catch(() => {});
        }
      } catch (_) {}
    }

    // 3. Forcibly purge any blocking overlay / modal elements directly from the DOM
    await page.evaluate(() => {
      try {
        const outlet = document.getElementById("artdeco-modal-outlet");
        if (outlet && outlet.children.length > 0) {
          outlet.innerHTML = "";
        }
        const overlays = document.querySelectorAll(
          ".artdeco-modal-overlay, .org-life-lightbox-modal, [data-test-modal-container], .modal-wormhole"
        );
        overlays.forEach((el) => el.remove());
        document.body.classList.remove("artdeco-modal-is-open");
        document.documentElement.classList.remove("artdeco-modal-is-open");
      } catch (_) {}
    }).catch(() => {});
  } catch (_) {}
}

/**
 * Strict filtering rules:
 * 1. Title MUST have "frontend" / "front-end" / "front end"
 * 2. Title MUST NOT contain "full stack", "fullstack", "backend", "back end", "java", "c#", "csharp", ".net", "dotnet"
 * 3. Title or Location MUST NOT contain "hybrid", "on-site", "onsite", "relocation provided", "in-office"
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

  // 2. Negative filter: NO Full Stack, Backend, Java, C#, Csharp, .NET, Dotnet, Python, Golang in title
  if (/\b(full[\s-]*stack|fullstack|back[\s-]*end|backend|java\b|c#|csharp|\.net|dotnet|golang|embedded|devops)\b/i.test(t)) {
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

  // 5. Check description for non-frontend roles
  if (description) {
    const d = description.toLowerCase();
    if (/\b(full[\s-]*stack engineer|full[\s-]*stack developer|backend engineer|backend developer|java developer|c# developer|\.net developer)\b/i.test(d)) {
      return false;
    }
  }

  return true;
}

// ─── State Management ─────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      return {
        completedCountries: Array.isArray(data.completedCountries) ? data.completedCountries : [],
        processedJobIds: Array.isArray(data.processedJobIds) ? data.processedJobIds : []
      };
    } catch (_) {}
  }
  return { completedCountries: [], processedJobIds: [] };
}

function saveState(state) {
  try {
    // Keep processedJobIds capped at most recent 40,000 to prevent unbounded file growth
    if (state.processedJobIds.length > 50000) {
      state.processedJobIds = state.processedJobIds.slice(-40000);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (_) {}
}

function loadJobs() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
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
  fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2) + "\n");
}

function hydrateAuthIfEnvPresent() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const envAuth = process.env.LINKEDIN_AUTH_JSON || process.env.LINKEDIN_AUTH_DATA;
  if (envAuth && !fs.existsSync(AUTH_FILE)) {
    try {
      console.log("💧 Hydrating LinkedIn auth session from environment variable...");
      fs.writeFileSync(AUTH_FILE, envAuth.trim());
    } catch (err) {
      console.warn("⚠️ Could not write auth session from env:", err.message);
    }
  }
}

// ─── Main Scraper Function ─────────────────────────────────────────────
async function runLinkedInScraper() {
  hydrateAuthIfEnvPresent();

  const state = loadState();
  const processedJobIdsSet = new Set(state.processedJobIds);
  const jobs = loadJobs();
  const initialCount = jobs.length;
  
  // Track uniqueness for on-the-fly deduplication
  const existingApplyUrls = new Set(jobs.map((j) => j.applyUrl));
  const existingHashes = new Set(jobs.map((j) => j.sourceHash));

  if (!fs.existsSync(AUTH_FILE)) {
    console.error("\n❌ No saved LinkedIn session found at:", AUTH_FILE);
    console.error("📋 What to do:");
    console.error("  1. Log in with your new LinkedIn account by running:");
    console.error("     npm run linkedin:login   (or: node scripts/linkedin-login.js)");
    console.error("  2. In GitHub Actions, add secret LINKEDIN_AUTH_JSON with the contents of data/linkedin-auth.json\n");
    process.exit(1);
  }

  console.log("\n🔑 Loading saved LinkedIn session...");

  // Headless mode enabled for CI and automated scraping (set HEADED=true for local headed mode)
  const isHeadless = process.env.HEADED !== "true";
  const browser = await chromium.launch({
    headless: isHeadless,
    slowMo: isHeadless ? 30 : 150,
    args: isHeadless
      ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      : ["--start-maximized"],
  });

  const context = await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  // Listen for new tabs (Apply buttons open external links in new tabs)
  let latestNewPageUrl = null;
  context.on("page", async (newPage) => {
    if (newPage === page) return;
    try {
      await newPage.waitForLoadState("domcontentloaded", { timeout: 15000 });
      latestNewPageUrl = newPage.url();
      await newPage.close();
    } catch (e) {
      latestNewPageUrl = newPage.url();
      try { await newPage.close(); } catch (_) {}
    }
  });

  // Verify session
  console.log("🔐 Verifying session...");
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 35000 });
  } catch (_) {}
  
  if (page.url().includes("/login") || page.url().includes("/authwall") || page.url().includes("/checkpoint/")) {
    console.error("\n❌ Session expired or challenge detected! Please re-login.");
    console.error("👉 Run `npm run linkedin:login` to refresh your login session.\n");
    await browser.close();
    process.exit(1);
  }

  console.log("✅ LinkedIn session verified. Starting scraper across prioritized locations...\n");
  if (isFinite(MAX_COUNTRIES_PER_RUN) || isFinite(MAX_RUNTIME_MINUTES)) {
    console.log(`⏱️ Limits: Max ${MAX_COUNTRIES_PER_RUN} countries | Max ${MAX_RUNTIME_MINUTES} minutes total runtime`);
  } else {
    console.log(`🌍 Running full scraper across all ${COUNTRIES.length} countries.`);
  }

  let addedTotal = 0;
  const startTime = Date.now();
  const maxRuntimeMs = isFinite(MAX_RUNTIME_MINUTES) ? MAX_RUNTIME_MINUTES * 60 * 1000 : Infinity;
  let countriesProcessedThisRun = 0;

  // ─── Scrape Countries Sequentially ─────────────────────────────────────
  for (const country of COUNTRIES) {
    // Check runtime limit if configured
    if (isFinite(maxRuntimeMs) && Date.now() - startTime >= maxRuntimeMs) {
      console.log(`\n⏰ Reached maximum run time limit (${MAX_RUNTIME_MINUTES} min). Gracefully finishing this run so jobs can be committed.`);
      break;
    }

    // Check countries batch limit if configured
    if (isFinite(MAX_COUNTRIES_PER_RUN) && countriesProcessedThisRun >= MAX_COUNTRIES_PER_RUN) {
      console.log(`\n🏁 Reached maximum countries batch limit (${MAX_COUNTRIES_PER_RUN} countries). Gracefully finishing this run so jobs can be committed.`);
      break;
    }

    if (state.completedCountries.includes(country)) {
      console.log(`⏭️  Skipping ${country} (already completed in current cycle).`);
      continue;
    }

    console.log(`\n🌍 Discovering jobs in ${country}...`);
    
    const jobsUrl = new URL("https://www.linkedin.com/jobs/search/");
    jobsUrl.searchParams.set("keywords", SEARCH_QUERY);
    jobsUrl.searchParams.set("location", country);
    jobsUrl.searchParams.set("f_WT", "2"); // Remote
    jobsUrl.searchParams.set("sortBy", "DD"); // Most recent
    
    try {
      await page.goto(jobsUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      console.log("  ⚠️ Navigation timeout, continuing.");
    }
    await sleep(LONG);
    await dismissModals(page);

    // Check if there are no exact matches
    let noResults = null;
    let noResultsText = false;
    try {
      noResults = await page.$('.jobs-search-no-results-banner, h1:has-text("No matching jobs found"), h2:has-text("No matching jobs found")');
      noResultsText = await page.evaluate(() => document.body ? document.body.innerText.includes("No matching jobs found") : false);
    } catch (err) {}

    if (noResults || noResultsText) {
      console.log(`   ⏭️  No exact matches found for ${country}. Skipping.`);
      state.completedCountries.push(country);
      countriesProcessedThisRun++;
      saveState(state);
      continue;
    }

    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`\n📄 ── ${country} | Page ${currentPage} ──────────────────────────`);
      await sleep(MEDIUM);
      await dismissModals(page);
      
      // Scroll list container to load all job cards
      const listContainer = await page.$(".jobs-search-results-list, .scaffold-layout__list");
      if (listContainer) {
        for (let i = 0; i < 6; i++) {
          await listContainer.evaluate((el) => el.scrollBy({ top: 350, behavior: "smooth" })).catch(() => {});
          await sleep(300);
        }
        await listContainer.evaluate((el) => el.scrollTo({ top: 0 })).catch(() => {});
        await sleep(SLOW);
      } else {
        // Fallback for alternate UI
        for (let i = 0; i < 4; i++) {
          await page.mouse.wheel(0, 400).catch(() => {});
          await sleep(250);
        }
        await page.mouse.wheel(0, -1600).catch(() => {});
        await sleep(SLOW);
      }

      // Target top-level job cards only
      const cardSelector = 'div[data-view-name="job-card"], [componentkey^="job-card-component-ref-"][role="button"], div[role="button"][componentkey]:has(figure), li.jobs-search-results__list-item, div.job-card-container';
      await page.waitForSelector(cardSelector, { timeout: 8000 }).catch(() => {});

      const jobCards = await page.$$(cardSelector);
      console.log(`   Found ${jobCards.length} job cards on this page.`);

      for (let i = 0; i < jobCards.length; i++) {
        try {
          const cards = await page.$$(cardSelector);
          if (i >= cards.length) break;

          const card = cards[i];

          // 1. Robustly extract job ID before clicking
          let jobId = await card.evaluate((el) => {
            const key = el.getAttribute('componentkey');
            if (key && key.startsWith('job-card-component-ref-')) return key.replace('job-card-component-ref-', '');
            if (el.getAttribute('data-job-id')) return el.getAttribute('data-job-id');
            if (el.getAttribute('data-entity-urn')) return el.getAttribute('data-entity-urn').split(':').pop();
            const inner = el.querySelector('[data-job-id]');
            if (inner) return inner.getAttribute('data-job-id');
            const innerUrn = el.querySelector('[data-entity-urn]');
            if (innerUrn) return innerUrn.getAttribute('data-entity-urn').split(':').pop();
            const a = el.matches('a[href*="/view/"]') ? el : el.querySelector('a[href*="/view/"], a[href*="/jobs/view/"]');
            if (a && a.href.includes('/view/')) {
              const parts = a.href.split(/\/view\/|\/jobs\/view\//);
              if (parts[1]) return parts[1].split('/')[0].split('?')[0];
            }
            return null;
          }).catch(() => null);

          // Skip immediately if already processed
          if (jobId && processedJobIdsSet.has(jobId)) {
            console.log(`   [${i + 1}/${jobCards.length}] ⏭️  Already processed job ID ${jobId} - skipping.`);
            continue;
          }

          // 2. Dismiss any lingering modals and scroll card into view
          await dismissModals(page);
          await card.evaluate((el) => {
            el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
          }).catch(() => {});
          await sleep(200);

          // 3. Click card with short timeout & force fallback (never hang for 30s)
          try {
            await card.click({ timeout: 3500 });
          } catch (_) {
            await dismissModals(page);
            try {
              await card.click({ force: true, timeout: 2500 });
            } catch (err) {
              await card.evaluate((el) => {
                const target = el.querySelector('a, button, [role="button"]') || el;
                target.click();
              }).catch(() => {});
            }
          }
          await sleep(MEDIUM);

          // If jobId wasn't on card element, check current URL
          if (!jobId) {
            jobId = await page.evaluate(() => {
              try {
                const u = new URL(window.location.href);
                return u.searchParams.get('currentJobId');
              } catch (_) {
                return null;
              }
            }).catch(() => null);
          }

          if (jobId && processedJobIdsSet.has(jobId)) {
            console.log(`   [${i + 1}/${jobCards.length}] ⏭️  Already processed job ID ${jobId} - skipping.`);
            continue;
          }

          // 4. Extract card-scoped details directly from this card element (never contaminated by card 0)
          const cardInfo = await card.evaluate((el) => {
            const titleEl = el.querySelector('.job-card-list__title, a[href*="/jobs/view/"], .artdeco-entity-lockup__title, strong, h3');
            const title = titleEl ? titleEl.innerText.trim() : '';

            const compEl = el.querySelector('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle, .job-card-container__company-name');
            const company = compEl ? compEl.innerText.trim().split('\n')[0].trim() : '';

            const locEl = el.querySelector('.job-card-container__metadata-item, .artdeco-entity-lockup__caption');
            const location = locEl ? locEl.innerText.trim() : '';

            const rawText = el.innerText || '';
            return { title, company, location, rawText };
          }).catch(() => ({ title: '', company: '', location: '', rawText: '' }));

          let cardTitle = cardInfo.title;
          let cardCompany = cardInfo.company;
          let cardLocation = cardInfo.location;
          const cardText = cardInfo.rawText;

          if (!cardTitle || !cardCompany) {
            const lines = cardText.split('\n').map(s => s.trim()).filter(l => 
              l && 
              !l.startsWith('Selected,') && 
              !l.includes('Verified job') && 
              !l.includes('Easy Apply') && 
              !l.includes('Promoted') && 
              !l.includes('ago') && 
              !l.includes('alumni')
            );
            if (!cardTitle && lines.length > 0) cardTitle = lines[0];
            if (!cardCompany && lines.length > 1) cardCompany = lines[1];
            if (!cardLocation && lines.length > 2) cardLocation = lines[2];
          }

          // 5. Extract details from Right Details Container (scoped strictly to details container, not whole page)
          const detailsContainer = await page.$(
            '.jobs-search__job-details--container, .jobs-details, .scaffold-layout__detail, main.scaffold-layout__main'
          );
          let detailTitle = '';
          let detailCompany = '';
          let detailLocation = '';

          if (detailsContainer) {
            const detailsInfo = await detailsContainer.evaluate((el) => {
              const tEl = el.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1');
              const cEl = el.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, a[href*="/company/"]');
              const lEl = el.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type');
              return {
                title: tEl ? tEl.innerText.trim() : '',
                company: cEl ? cEl.innerText.trim().split('\n')[0].trim() : '',
                location: lEl ? lEl.innerText.trim() : ''
              };
            }).catch(() => ({ title: '', company: '', location: '' }));

            detailTitle = detailsInfo.title;
            detailCompany = detailsInfo.company;
            detailLocation = detailsInfo.location;
          }

          // Combine title: verify detailTitle is for this card and not stale from the previous card
          let title = cardTitle;
          if (detailTitle) {
            const cleanDetail = detailTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanCard = cardTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!cleanCard || cleanDetail.includes(cleanCard.slice(0, 15)) || cleanCard.includes(cleanDetail.slice(0, 15))) {
              title = detailTitle;
            }
          }
          if (!title) title = detailTitle || "Frontend Developer";

          let company = detailCompany || cardCompany || "Unknown Company";
          let location = detailLocation || cardLocation || country;

          // Extract full job description
          let description = "";
          try {
            description = await page.evaluate(() => {
              // 1. Classic container
              const classic = document.querySelector("#job-details, .jobs-description__container, .jobs-description-content__text");
              if (classic && classic.innerText.trim().length > 50) return classic.innerText.trim();

              // 2. 'About the job' section in modern UI
              const allEls = Array.from(document.querySelectorAll('*'));
              const aboutEl = allEls.find(e => (e.innerText || '').trim() === 'About the job');
              if (aboutEl) {
                let curr = aboutEl;
                for (let step = 0; step < 5; step++) {
                  if (curr.nextElementSibling && curr.nextElementSibling.innerText.trim().length > 50) {
                    return curr.nextElementSibling.innerText.trim();
                  }
                  curr = curr.parentElement;
                }
              }

              // 3. Fallback to article or main
              const article = document.querySelector('article, main section');
              if (article && article.innerText.trim().length > 100) return article.innerText.trim();
              return "";
            });
          } catch (_) {}

          // 6. User Requirement: "do not take easy apply ones only take the apply ones where there is careers website"
          if (/easy\s*apply/i.test(cardText)) {
            console.log(`\n   [${i + 1}/${jobCards.length}] ${title} @ ${company}`);
            console.log(`       ⏭️  Easy Apply listed on card - skipping.`);
            if (jobId) {
              processedJobIdsSet.add(jobId);
              state.processedJobIds.push(jobId);
            }
            continue;
          }

          console.log(`\n   [${i + 1}/${jobCards.length}] ${title} @ ${company}`);

          // 7. Strict Frontend Check (excludes fullstack, backend, java, c#, csharp, .net, onsite, hybrid)
          if (!isStrictFrontend(title, location, description, jobId || '')) {
            console.log(`       ⏭️  Skipping non-frontend or non-remote job: ${title}`);
            if (jobId) {
              processedJobIdsSet.add(jobId);
              state.processedJobIds.push(jobId);
            }
            saveState(state);
            continue;
          }

          // 8. Look for direct offsite careers URL or safety/go redirect link
          const targetContainer = detailsContainer || page;
          let cleanUrl = null;

          const directApplyLink = await targetContainer.$('a[href*="safety/go/?url="]');
          if (directApplyLink) {
            const rawHref = await directApplyLink.getAttribute("href");
            try {
              const u = new URL(rawHref);
              cleanUrl = u.searchParams.get("url") || rawHref;
            } catch (_) {
              cleanUrl = rawHref;
            }
          }

          const applyButton = await targetContainer.$(
            'button.jobs-apply-button, ' +
            '.jobs-details__main-content button.jobs-apply-button, ' +
            '.job-details-jobs-unified-top-card__container--two-pane button.jobs-apply-button, ' +
            '.jobs-unified-top-card button.jobs-apply-button, ' +
            '.jobs-details button.jobs-apply-button, ' +
            '.job-details-jobs-unified-top-card__content button.jobs-apply-button, ' +
            'a[href*="safety/go/?url="], ' +
            'button:has-text("Apply"), a:has-text("Apply")'
          );

          if (!cleanUrl && applyButton) {
            const buttonText = (await applyButton.innerText().catch(() => '')).trim();

            if (/easy\s*apply/i.test(buttonText)) {
              console.log(`       ⏭️  Easy Apply button detected ('${buttonText}') - skipping as requested.`);
              if (jobId) {
                processedJobIdsSet.add(jobId);
                state.processedJobIds.push(jobId);
              }
              saveState(state);
              continue;
            }

            if (/applied/i.test(buttonText)) {
              console.log(`       ⏭️  Already applied button ('${buttonText}') — skipping.`);
              if (jobId) {
                processedJobIdsSet.add(jobId);
                state.processedJobIds.push(jobId);
              }
              saveState(state);
              continue;
            }

            // Check if applyButton is an <a> tag pointing to external link
            const btnTag = await applyButton.evaluate(el => el.tagName).catch(() => '');
            const btnHref = await applyButton.getAttribute("href").catch(() => null);
            if (btnTag === 'A' && btnHref) {
              if (btnHref.includes("safety/go/?url=")) {
                try {
                  const u = new URL(btnHref);
                  cleanUrl = u.searchParams.get("url") || btnHref;
                } catch (_) {
                  cleanUrl = btnHref;
                }
              } else if (!btnHref.includes("linkedin.com")) {
                cleanUrl = btnHref;
              }
            }

            // If not resolved yet, click Apply button to catch new tab or redirect
            if (!cleanUrl) {
              latestNewPageUrl = null;
              await applyButton.click({ timeout: 4000 }).catch(() => {});
              await sleep(2000);

              if (latestNewPageUrl) {
                cleanUrl = latestNewPageUrl;
                try {
                  const parsed = new URL(cleanUrl);
                  if (parsed.hostname.includes("linkedin.com")) {
                    const dest = parsed.searchParams.get("url") || parsed.searchParams.get("dest") || parsed.searchParams.get("redirectUrl");
                    if (dest) cleanUrl = decodeURIComponent(dest);
                  }
                } catch (_) {}
              } else {
                const currentUrl = page.url();
                if (!currentUrl.includes("linkedin.com/jobs") && !currentUrl.includes("linkedin.com/feed")) {
                  cleanUrl = currentUrl;
                  await page.goBack().catch(() => {});
                  await sleep(MEDIUM);
                } else {
                  const modalLink = await page.$('.jobs-apply-button__redirect-url, a[href*="apply"], .artdeco-modal a[target="_blank"]');
                  if (modalLink) {
                    const href = await modalLink.getAttribute("href");
                    if (href) cleanUrl = href;
                  }
                }
              }
            }

            // ALWAYS immediately dismiss any modal opened by clicking apply
            await dismissModals(page);
          }

          // Unescape / decode cleanUrl if needed
          if (cleanUrl) {
            try {
              if (cleanUrl.includes("safety/go/?url=")) {
                const u = new URL(cleanUrl);
                cleanUrl = u.searchParams.get("url") || cleanUrl;
              }
              cleanUrl = decodeURIComponent(cleanUrl);
            } catch (_) {}
          }

          // Strictly require external company careers website (no LinkedIn links, no Easy Apply)
          const isValidExternalCareersUrl = cleanUrl && 
            cleanUrl.startsWith("http") && 
            !cleanUrl.includes("linkedin.com") && 
            !cleanUrl.includes("application-settings");

          if (!isValidExternalCareersUrl) {
            console.log(`       ⏭️  Skipping: No external company careers website found (URL: ${cleanUrl || 'none'}).`);
            if (jobId) {
              processedJobIdsSet.add(jobId);
              state.processedJobIds.push(jobId);
            }
            saveState(state);
            continue;
          }

          const sourceHash = generateId(cleanUrl);

          if (existingApplyUrls.has(cleanUrl) || existingHashes.has(sourceHash)) {
            console.log(`       🔄 Duplicate detected - skipping save.`);
          } else {
            console.log(`       ✅ New Job: ${cleanUrl}`);

            const companyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
            const jobSlug = generateSlug(title, company, sourceHash);

            const newJob = {
              id: sourceHash,
              title,
              applyUrl: cleanUrl,
              description,
              location: `Remote - ${country}`,
              country: country,
              remoteType: "REMOTE",
              postedAt: new Date().toISOString(),
              sourceHash,
              company: {
                id: companyDomain.split('.')[0] || 'company',
                name: company,
                logoUrl: `https://logo.clearbit.com/${companyDomain}`,
                industry: "Technology",
                website: `https://${companyDomain}`
              },
              slug: jobSlug
            };

            // Fast regex metadata tagging
            newJob.aiTags = extractTags(newJob);

            jobs.unshift(newJob);
            existingApplyUrls.add(cleanUrl);
            existingHashes.add(sourceHash);
            addedTotal++;
            
            saveJobs(jobs);
            console.log(`       💾 Saved directly to jobs.json (Total jobs: ${jobs.length})`);
          }

          if (jobId) {
            processedJobIdsSet.add(jobId);
            state.processedJobIds.push(jobId);
          }
          saveState(state); // Update state after every card

        } catch (err) {
          console.log(`       ❌ Error processing card ${i}: ${err.message}`);
          await dismissModals(page);
        }
      }

      if (jobCards.length === 0) {
        console.log(`\n       ⏭️  0 job cards found on this page. Reached the end of results. Moving to next country.`);
        hasMorePages = false;
        continue;
      }

      if (currentPage >= MAX_PAGES_PER_COUNTRY) {
        console.log(`\n       🏁 Reached maximum page limit (${MAX_PAGES_PER_COUNTRY}) for ${country}. Moving to next country.`);
        hasMorePages = false;
        continue;
      }

      try {
        const nextButton = await page.$(
          `button[aria-label="Page ${currentPage + 1}"], ` +
          `li[data-test-pagination-page-btn="${currentPage + 1}"] button, ` +
          `button:has-text("${currentPage + 1}")`
        );
        if (nextButton) {
          await dismissModals(page);
          await nextButton.scrollIntoViewIfNeeded().catch(() => {});
          await sleep(SLOW);
          await nextButton.click({ force: true, timeout: 5000 });
          currentPage++;
          await sleep(LONG);
        } else {
          const nextArrow = await page.$('button[aria-label="Next"], button.artdeco-pagination__button--next, button:has-text("Next")');
          if (nextArrow && (await nextArrow.isEnabled())) {
            await dismissModals(page);
            await nextArrow.click({ force: true, timeout: 5000 });
            currentPage++;
            await sleep(LONG);
          } else {
            hasMorePages = false;
          }
        }
      } catch (err) {
        console.log(`\n       ⚠️ Could not click next page: ${err.message}. Moving to next country.`);
        hasMorePages = false;
      }
    }

    // Finished this country
    state.completedCountries.push(country);
    countriesProcessedThisRun++;
    saveState(state);
    console.log(`\n✅ Completed all jobs in ${country}.`);
  }

  // Check if entire cycle finished across all runs
  const uncompleted = COUNTRIES.filter(c => !state.completedCountries.includes(c));
  if (uncompleted.length === 0) {
    console.log(`\n🎉 Completed all countries across cycle! Resetting country cycle for next run.`);
    state.completedCountries = [];
    saveState(state);
  } else {
    console.log(`\n📊 Country cycle progress: ${state.completedCountries.length}/${COUNTRIES.length} completed.`);
  }

  try {
    await context.storageState({ path: AUTH_FILE });
  } catch (_) {}

  await browser.close();

  console.log(`\n📊 Scrape complete. New jobs added: ${addedTotal} | Total active jobs: ${jobs.length}`);
}

if (require.main === module) {
  runLinkedInScraper().catch((err) => {
    console.error("❌ Fatal scraper error:", err);
    process.exit(1);
  });
}

module.exports = { runLinkedInScraper };
