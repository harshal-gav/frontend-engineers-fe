const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── Config ───────────────────────────────────────────────────────────
const SEARCH_QUERY = "frontend engineer";
const COUNTRIES = [
  "Afghanistan",
  "Åland Islands",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antarctica",
  "Antigua & Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
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
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Caribbean Netherlands",
  "Bosnia & Herzegovina",
  "Botswana",
  "Bouvet Island",
  "Brazil",
  "British Indian Ocean Territory",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cape Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cayman Islands",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Colombia",
  "Comoros",
  "Congo - Brazzaville",
  "Congo - Kinshasa",
  "Cook Islands",
  "Costa Rica",
  "Côte d’Ivoire",
  "Croatia",
  "Cuba",
  "Curaçao",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Falkland Islands",
  "Faroe Islands",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern Territories",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard & McDonald Islands",
  "Vatican City",
  "Honduras",
  "Hong Kong SAR China",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "North Korea",
  "South Korea",
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
  "Macao SAR China",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "North Macedonia",
  "Northern Mariana Islands",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestinian Territories",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Pitcairn Islands",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Réunion",
  "Romania",
  "Russia",
  "Rwanda",
  "St. Barthélemy",
  "St. Helena",
  "St. Kitts & Nevis",
  "St. Lucia",
  "St. Martin",
  "St. Pierre & Miquelon",
  "St. Vincent & Grenadines",
  "Samoa",
  "San Marino",
  "São Tomé & Príncipe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Sint Maarten",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia & South Sandwich Islands",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Svalbard & Jan Mayen",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad & Tobago",
  "Tunisia",
  "Türkiye",
  "Turkmenistan",
  "Turks & Caicos Islands",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "U.S. Outlying Islands",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "British Virgin Islands",
  "U.S. Virgin Islands",
  "Wallis & Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

const DB_FILE = path.join(__dirname, "..", "data", "jobs.json");
const STATE_FILE = path.join(__dirname, "..", "data", "scraper-state.json");
const AUTH_FILE = path.join(__dirname, "..", "data", "linkedin-auth.json");

// Wait times (ms) - keep it human-like
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
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${cleanTitle}-${cleanCompany}-${id.substring(0, 8)}`;
}

// ─── State Management ─────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }
  return { completedCountries: [], processedJobIds: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadJobs() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return [];
}

function saveJobs(jobs) {
  fs.writeFileSync(DB_FILE, JSON.stringify(jobs, null, 2));
}

// ─── Main ─────────────────────────────────────────────────────────────
(async () => {
  const state = loadState();
  const jobs = loadJobs();
  
  // Track uniqueness for on-the-fly deduplication
  const existingApplyUrls = new Set(jobs.map((j) => j.applyUrl));
  const existingHashes = new Set(jobs.map((j) => j.sourceHash));

  if (!fs.existsSync(AUTH_FILE)) {
    console.log("❌ No saved LinkedIn session found at:", AUTH_FILE);
    process.exit(1);
  }

  console.log("🔑 Loading saved LinkedIn session...");

  // Headed mode enabled for human-like interaction
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ["--start-maximized"],
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
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (_) {}
  
  if (page.url().includes("/login") || page.url().includes("/authwall")) {
    console.log("❌ Session expired! Please re-login.");
    await browser.close();
    process.exit(1);
  }

  // ─── Scrape Countries Sequentially ─────────────────────────────────────
  for (const country of COUNTRIES) {
    if (state.completedCountries.includes(country)) {
      console.log(`\n⏭️  Skipping ${country} (already completed).`);
      continue;
    }

    console.log(`\n🌍 Discovering jobs in ${country}...`);
    
    const jobsUrl = new URL("https://www.linkedin.com/jobs/search/");
    jobsUrl.searchParams.set("keywords", SEARCH_QUERY);
    jobsUrl.searchParams.set("location", country);
    jobsUrl.searchParams.set("f_WT", "2"); // Remote
    
    try {
      await page.goto(jobsUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      console.log("  ⚠️ Navigation timeout, continuing.");
    }
    await sleep(LONG);

    // Check if there are no exact matches
    const noResults = await page.$('.jobs-search-no-results-banner, h1:has-text("No matching jobs found"), h2:has-text("No matching jobs found")');
    const noResultsText = await page.evaluate(() => document.body.innerText.includes("No matching jobs found"));

    if (noResults || noResultsText) {
        console.log(`\n⏭️  No exact matches found for ${country}. Skipping recommended jobs.`);
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
      }

      // Grab cards
      const jobCards = await page.$$('.job-card-container, .job-search-card, [data-job-id], .job-card-list__title');

      console.log(`   Found ${jobCards.length} job cards on this page.`);

      let newJobsFoundOnPage = 0;

      for (let i = 0; i < jobCards.length; i++) {
        try {
          // Re-query cards
          const cards = await page.$$('.job-card-container, .job-search-card, [data-job-id], .job-card-list__title');
          if (i >= cards.length) break;

          const card = cards[i];
          
          // Robustly extract job ID
          let jobId = await card.evaluate((el) => {
            if (el.getAttribute('data-job-id')) return el.getAttribute('data-job-id');
            if (el.getAttribute('data-entity-urn')) return el.getAttribute('data-entity-urn').split(':').pop();
            const inner = el.querySelector('[data-job-id]');
            if (inner) return inner.getAttribute('data-job-id');
            const innerUrn = el.querySelector('[data-entity-urn]');
            if (innerUrn) return innerUrn.getAttribute('data-entity-urn').split(':').pop();
            const a = el.matches('a[href*="/view/"]') ? el : el.querySelector('a[href*="/view/"]');
            if (a && a.href.includes('/view/')) return a.href.split('/view/')[1].split('/')[0].split('?')[0];
            return el.innerText.substring(0, 50).replace(/\\s+/g, ''); // Fallback
          });

          if (jobId && state.processedJobIds.includes(jobId)) {
            // console.log(`       ⏭️  Already processed job ${jobId} — skipping click.`);
            continue;
          }

          await card.scrollIntoViewIfNeeded();
          await sleep(SLOW);
          await card.click();
          await sleep(MEDIUM);

          newJobsFoundOnPage++;

          if (jobId) {
            state.processedJobIds.push(jobId);
          }

          // Extract details
          const titleEl = await page.$(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24");
          const companyEl = await page.$(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
          const locationEl = await page.$(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet");
          const descriptionEl = await page.$(".jobs-description__container, #job-details");

          const title = titleEl ? (await titleEl.innerText()).trim() : "Unknown Title";
          const company = companyEl ? (await companyEl.innerText()).trim() : "Unknown Company";
          const location = locationEl ? (await locationEl.innerText()).trim() : country;
          const description = descriptionEl ? (await descriptionEl.innerText()).trim() : "";

          console.log(`\n   [${i + 1}/${jobCards.length}] ${title} @ ${company}`);

          const titleLower = title.toLowerCase();
          const isFrontend = titleLower.includes("front") || titleLower.includes("react") || titleLower.includes("vue") || titleLower.includes("angular") || titleLower.includes("web") || titleLower.includes("js") || titleLower.includes("ts");
          
          if (!isFrontend) {
             console.log(`       ⏭️  Skipping non-frontend job: ${title}`);
             saveState(state);
             continue;
          }

          const applyButton = await page.$('.jobs-details__main-content button.jobs-apply-button, .job-details-jobs-unified-top-card__container--two-pane button.jobs-apply-button, .jobs-unified-top-card button.jobs-apply-button, .jobs-details button.jobs-apply-button, .job-details-jobs-unified-top-card__content button.jobs-apply-button');

          if (!applyButton) {
            console.log("       ⏭️  No Apply button found (might be Easy Apply only) — skipping.");
            saveState(state);
            continue;
          }

          const buttonText = (await applyButton.innerText()).trim();
          if (buttonText.toLowerCase().includes("easy apply")) {
            console.log("       ⏭️  Easy Apply — skipping.");
            saveState(state);
            continue;
          }

          latestNewPageUrl = null;
          await applyButton.click({ timeout: 5000 }).catch(() => {});
          await sleep(LONG);

          let cleanUrl = null;

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
            if (!currentUrl.includes("linkedin.com/jobs")) {
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
              }
            }
          }

          if (cleanUrl) {
            const sourceHash = generateId(cleanUrl);

            if (existingApplyUrls.has(cleanUrl) || existingHashes.has(sourceHash)) {
              console.log(`       🔄 Duplicate detected - skipping save.`);
            } else {
              console.log(`       ✅ New Job: ${cleanUrl}`);

              const companyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
              const jobSlug = generateSlug(title, company, sourceHash);
              const salaryMin = Math.floor(Math.random() * (130 - 90 + 1) + 90) * 1000;
              const salaryMax = Math.floor(Math.random() * (190 - 140 + 1) + 140) * 1000;

              const newJob = {
                id: sourceHash,
                title,
                applyUrl: cleanUrl,
                description,
                location: `Remote - ${country}`,
                city: "",
                state: "",
                country: country,
                remoteType: "REMOTE",
                salaryMin,
                salaryMax,
                currency: "USD",
                experienceLevel: "MID",
                employmentType: "FULL_TIME",
                department: "Engineering",
                postedAt: new Date().toISOString(),
                sourceHash,
                company: {
                  id: companyDomain.split('.')[0],
                  name: company,
                  logoUrl: `https://logo.clearbit.com/${companyDomain}`,
                  industry: "Technology",
                  website: `https://${companyDomain}`
                },
                slug: jobSlug
              };

              jobs.unshift(newJob);
              existingApplyUrls.add(cleanUrl);
              existingHashes.add(sourceHash);
              
              saveJobs(jobs);
              console.log(`       💾 Saved directly to jobs.json (Total jobs: ${jobs.length})`);
            }
          }

          saveState(state); // Update state after every card

        } catch (err) {
          console.log(`       ❌ Error processing card ${i}: ${err.message}`);
        }
      }

      // Next page limit removed, will rely on UI next button logic

      if (newJobsFoundOnPage === 0) {
        console.log(`\n       ⏭️  0 new jobs found on this page. Reached the end of results. Moving to next country.`);
        hasMorePages = false;
        continue;
      }

      const nextButton = await page.$(`button[aria-label="Page ${currentPage + 1}"], li[data-test-pagination-page-btn="${currentPage + 1}"] button`);
      if (nextButton) {
        await nextButton.scrollIntoViewIfNeeded();
        await sleep(SLOW);
        await nextButton.click();
        currentPage++;
        await sleep(LONG);
      } else {
        const nextArrow = await page.$('button[aria-label="Next"], button.artdeco-pagination__button--next');
        if (nextArrow && (await nextArrow.isEnabled())) {
          await nextArrow.click();
          currentPage++;
          await sleep(LONG);
        } else {
          hasMorePages = false;
        }
      }
    }

    // Finished this country
    state.completedCountries.push(country);
    saveState(state);
    console.log(`\n✅ Completed all jobs in ${country}.`);
  }

  console.log(`\n🎉 Completely Finished parsing all countries!`);
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

})();
