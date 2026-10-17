#!/usr/bin/env node
/**
 * LinkedIn Playwright Scraper for All Countries (Remote Frontend Developer Jobs)
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes LinkedIn for Remote Frontend Developer roles across all countries
 * using authenticated session storage (`data/linkedin-auth.json`).
 * 
 * Features:
 * - Sequentially queries ~195 countries with remote & most recent filters
 * - Strict Frontend Filtering (excludes Full Stack, Backend, Hybrid, Onsite)
 * - Auto-prunes listings older than 30 days
 * - Generates fast regex AI enrichment tags on insertion (stack, seniority, remoteScope)
 * - Supports state resume via `data/scraper-state.json`
 * - Automatically hydrates auth state from `LINKEDIN_AUTH_JSON` or `LINKEDIN_AUTH_DATA` env vars
 * 
 * Usage:
 *   node scripts/linkedin-scraper.js
 *   npm run scrape:linkedin
 *   MAX_PAGES=2 HEADED=true node scripts/linkedin-scraper.js
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
const ALL_COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
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
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
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
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
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
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
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
  if (process.env.MAX_COUNTRIES) {
    const max = parseInt(process.env.MAX_COUNTRIES, 10);
    if (!isNaN(max) && max > 0) {
      return ALL_COUNTRIES.slice(0, max);
    }
  }
  return ALL_COUNTRIES;
}

const COUNTRIES = resolveCountries();

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "jobs.json");
const STATE_FILE = path.join(DATA_DIR, "scraper-state.json");
const AUTH_FILE = path.join(DATA_DIR, "linkedin-auth.json");
const MAX_PAGES_PER_COUNTRY = parseInt(process.env.MAX_PAGES || "2", 10);
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Specific blocked job IDs / target hashes
const BLOCKED_TARGETS = [
  '58c63410',
  'eb615191',
  '1d9d3706'
];

// Wait times (ms)
const SLOW = 800;
const MEDIUM = 1500;
const LONG = 3000;

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
    slowMo: isHeadless ? 50 : 200,
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

  // Listen for new tabs (Apply buttons open a new tab)
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

  console.log("✅ LinkedIn session verified. Starting scraper across all countries...\n");

  let addedTotal = 0;

  // ─── Scrape Countries Sequentially ─────────────────────────────────────
  for (const country of COUNTRIES) {
    if (state.completedCountries.includes(country)) {
      console.log(`⏭️  Skipping ${country} (already completed in current cycle).`);
      continue;
    }

    console.log(`\n🌍 Discovering jobs in ${country}...`);
    
    const jobsUrl = new URL("https://www.linkedin.com/jobs/search/");
    jobsUrl.searchParams.set("keywords", `${SEARCH_QUERY} ${country}`);
    jobsUrl.searchParams.set("location", country);
    jobsUrl.searchParams.set("f_WT", "2"); // Remote
    jobsUrl.searchParams.set("sortBy", "DD"); // Most recent
    
    try {
      await page.goto(jobsUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      console.log("  ⚠️ Navigation timeout, continuing.");
    }
    await sleep(LONG);

    // Check if there are no exact matches
    let noResults = null;
    let noResultsText = false;
    try {
      noResults = await page.$('.jobs-search-no-results-banner, h1:has-text("No matching jobs found"), h2:has-text("No matching jobs found")');
      noResultsText = await page.evaluate(() => document.body ? document.body.innerText.includes("No matching jobs found") : false);
    } catch (err) {
      // ignore
    }

    if (noResults || noResultsText) {
      console.log(`   ⏭️  No exact matches found for ${country}. Skipping.`);
      state.completedCountries.push(country);
      saveState(state);
      continue;
    }

    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`\n📄 ── ${country} | Page ${currentPage} ──────────────────────────`);
      await sleep(MEDIUM);
      
      // Scroll to load all job cards
      const listContainer = await page.$(".jobs-search-results-list, .scaffold-layout__list");
      if (listContainer) {
        for (let i = 0; i < 8; i++) {
          await listContainer.evaluate((el) => el.scrollBy({ top: 300, behavior: "smooth" }));
          await sleep(400);
        }
        await listContainer.evaluate((el) => el.scrollTo({ top: 0 }));
        await sleep(SLOW);
      } else {
        // Fallback for new LinkedIn UI
        for (let i = 0; i < 6; i++) {
          await page.mouse.wheel(0, 400);
          await sleep(300);
        }
        await page.mouse.wheel(0, -2400);
        await sleep(SLOW);
      }

      // Wait for jobs to load (support new AI UI, modern cards, and classic UI)
      const cardSelector = 'div[role="button"][componentkey]:has(figure), [componentkey^="job-card-component-ref-"][role="button"], .job-card-container, .job-search-card, [data-job-id], .job-card-list__title';
      await page.waitForSelector(cardSelector, { timeout: 10000 }).catch(() => {});

      // Grab cards
      const jobCards = await page.$$(cardSelector);
      console.log(`   Found ${jobCards.length} job cards on this page.`);

      let newJobsFoundOnPage = 0;

      for (let i = 0; i < jobCards.length; i++) {
        try {
          const cards = await page.$$(cardSelector);
          if (i >= cards.length) break;

          const card = cards[i];
          
          // Robustly extract job ID
          let jobId = await card.evaluate((el) => {
            const key = el.getAttribute('componentkey');
            if (key && key.startsWith('job-card-component-ref-')) return key.replace('job-card-component-ref-', '');
            if (el.getAttribute('data-job-id')) return el.getAttribute('data-job-id');
            if (el.getAttribute('data-entity-urn')) return el.getAttribute('data-entity-urn').split(':').pop();
            const inner = el.querySelector('[data-job-id]');
            if (inner) return inner.getAttribute('data-job-id');
            const innerUrn = el.querySelector('[data-entity-urn]');
            if (innerUrn) return innerUrn.getAttribute('data-entity-urn').split(':').pop();
            const a = el.matches('a[href*="/view/"]') ? el : el.querySelector('a[href*="/view/"]');
            if (a && a.href.includes('/view/')) return a.href.split('/view/')[1].split('/')[0].split('?')[0];
            return null;
          });

          await card.scrollIntoViewIfNeeded();
          await sleep(SLOW);
          await card.click();
          await sleep(MEDIUM);

          // If jobId wasn't on the card element before click, check current URL
          if (!jobId) {
            jobId = await page.evaluate(() => {
              try {
                const u = new URL(window.location.href);
                return u.searchParams.get('currentJobId');
              } catch (_) {
                return null;
              }
            });
          }

          if (jobId && state.processedJobIds.includes(jobId)) {
            console.log(`   [${i + 1}/${jobCards.length}] ⏭️  Already processed job ID ${jobId} - skipping.`);
            continue;
          }

          newJobsFoundOnPage++;

          if (jobId) {
            state.processedJobIds.push(jobId);
          }

          // Extract details (supports both new AI UI and classic UI)
          const titleEl = await page.$("a[href*='/jobs/view/'], .job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, h1");
          const companyEl = await page.$("a[href*='/company/'], .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
          const locationEl = await page.$(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type");

          let title = titleEl ? (await titleEl.innerText()).trim() : "";
          let company = companyEl ? (await companyEl.innerText()).trim().split('\n')[0].trim() : "";
          let location = locationEl ? (await locationEl.innerText()).trim() : "";

          // Fallback to card text if needed
          const cardText = await card.innerText();
          if (!title || !company) {
            try {
              const cardLines = cardText.split('\n').map(s => s.trim()).filter(Boolean);
              const filteredLines = cardLines.filter(l => !l.startsWith('Selected,') && !l.includes('Verified job'));
              if (!title && filteredLines.length > 0) title = filteredLines[0];
              if (!company && filteredLines.length > 1) company = filteredLines[1];
              if (!location && filteredLines.length > 2) location = filteredLines[2];
            } catch (_) {}
          }

          if (!title) title = "Unknown Title";
          if (!company) company = "Unknown Company";
          if (!location) location = country;

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

          console.log(`\n   [${i + 1}/${jobCards.length}] ${title} @ ${company}`);

          // Strict Frontend Check (excludes fullstack, backend, java, c#, csharp, .net, onsite, hybrid)
          if (!isStrictFrontend(title, location, description, jobId || '')) {
            console.log(`       ⏭️  Skipping non-frontend or non-remote job: ${title}`);
            saveState(state);
            continue;
          }

          // User Requirement: "do not take easy assply ones only take the apply ones where there is careers website"
          if (/easy\s*apply/i.test(cardText)) {
            console.log(`       ⏭️  Easy Apply listed on card - skipping.`);
            saveState(state);
            continue;
          }

          // Look for direct offsite careers URL or safety/go redirect link
          let cleanUrl = null;
          const directApplyLink = await page.$('a[href*="safety/go/?url="]');
          if (directApplyLink) {
            const rawHref = await directApplyLink.getAttribute("href");
            try {
              const u = new URL(rawHref);
              cleanUrl = u.searchParams.get("url") || rawHref;
            } catch (_) {
              cleanUrl = rawHref;
            }
          }

          const applyButton = await page.$(
            '.jobs-details__main-content button.jobs-apply-button, ' +
            '.job-details-jobs-unified-top-card__container--two-pane button.jobs-apply-button, ' +
            '.jobs-unified-top-card button.jobs-apply-button, ' +
            '.jobs-details button.jobs-apply-button, ' +
            '.job-details-jobs-unified-top-card__content button.jobs-apply-button, ' +
            'a[href*="safety/go/?url="], ' +
            'button:has-text("Apply"), a:has-text("Apply")'
          );

          if (!cleanUrl && applyButton) {
            const buttonText = (await applyButton.innerText()).trim();

            if (/easy\s*apply/i.test(buttonText)) {
              console.log(`       ⏭️  Easy Apply button detected ('${buttonText}') - skipping as requested.`);
              saveState(state);
              continue;
            }

            if (/applied/i.test(buttonText)) {
              console.log(`       ⏭️  Already applied button ('${buttonText}') — skipping.`);
              saveState(state);
              continue;
            }

            // Check if applyButton is an <a> tag pointing to safety/go or external link
            const btnTag = await applyButton.evaluate(el => el.tagName);
            const btnHref = await applyButton.getAttribute("href");
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

            // If not resolved yet, click the Apply button to catch new tab or redirect to company careers page
            if (!cleanUrl) {
              latestNewPageUrl = null;
              await applyButton.click({ timeout: 5000 }).catch(() => {});
              await sleep(LONG);

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
                  await page.goBack();
                  await sleep(MEDIUM);
                } else {
                  const modalLink = await page.$('.jobs-apply-button__redirect-url, a[href*="apply"], .artdeco-modal a[target="_blank"]');
                  if (modalLink) {
                    const href = await modalLink.getAttribute("href");
                    if (href) cleanUrl = href;
                  }
                  const closeBtn = await page.$('button[aria-label="Dismiss"], .artdeco-modal__dismiss');
                  if (closeBtn) {
                    await closeBtn.click();
                    await sleep(SLOW);
                    const discardBtn = await page.$('button[data-test-dialog-primary-btn], button[data-control-name="discard_application_confirm_btn"]');
                    if (discardBtn) {
                      await discardBtn.click();
                      await sleep(SLOW);
                    }
                  }
                }
              }
            }
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
            saveState(state);
            continue;
          }

          if (cleanUrl) {
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
          }

          saveState(state); // Update state after every card

        } catch (err) {
          console.log(`       ❌ Error processing card ${i}: ${err.message}`);
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
          await nextButton.scrollIntoViewIfNeeded();
          await sleep(SLOW);
          await nextButton.click({ force: true, timeout: 5000 });
          currentPage++;
          await sleep(LONG);
        } else {
          const nextArrow = await page.$('button[aria-label="Next"], button.artdeco-pagination__button--next, button:has-text("Next")');
          if (nextArrow && (await nextArrow.isEnabled())) {
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
    saveState(state);
    console.log(`\n✅ Completed all jobs in ${country}.`);
  }

  console.log(`\n🎉 Completely Finished parsing all countries!`);
  
  // Reset completed countries for the next scheduled cycle
  state.completedCountries = [];
  saveState(state);

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
