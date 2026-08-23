const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SEARCH_QUERY = "frontend engineer";
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];
const OUTPUT_FILE = path.join(__dirname, "..", "data", "linkedin-jobs.json");
const AUTH_FILE = path.join(__dirname, "..", "data", "linkedin-auth.json");

const CONCURRENCY = 1;

// Wait times (ms)
const SLOW = 800;
const MEDIUM = 1500;
const LONG = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveResults(jobs) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jobs, null, 2));
  console.log(`💾 Saved ${jobs.length} jobs to linkedin-jobs.json`);
}

// ─── Main ─────────────────────────────────────────────────────────────
(async () => {
  const collectedJobs = [];
  let existingJobs = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingJobs = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      collectedJobs.push(...existingJobs);
    } catch(e) {}
  }
  const existingApplyUrls = new Set(collectedJobs.map(j => j.applyUrl));

  if (!fs.existsSync(AUTH_FILE)) {
    console.log("❌ No saved LinkedIn session found at:", AUTH_FILE);
    process.exit(1);
  }

  console.log("🔑 Loading saved LinkedIn session...");

  // Headless mode enabled!
  const browser = await chromium.launch({
    headless: true,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

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

  // ─── Phase 1: Discovery (Find Job IDs) ────────────────────────────────
  const jobIds = [];

  for (const country of COUNTRIES) {
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

    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      await sleep(MEDIUM);
      
      // Scroll the container to load all li elements
      const listContainer = await page.$(".jobs-search-results-list, .scaffold-layout__list");
      if (listContainer) {
        for (let i = 0; i < 5; i++) {
          await listContainer.evaluate((el) => el.scrollBy({ top: 500, behavior: "smooth" }));
          await sleep(200);
        }
      }

      // Extract all job IDs on this page
      const cardElements = await page.$$('li[data-job-id], div[data-job-id]');
      let foundOnPage = 0;
      
      for (const card of cardElements) {
        const id = await card.getAttribute('data-job-id');
        if (id) {
          jobIds.push({ id, country });
          foundOnPage++;
        }
      }
      
      console.log(`   📄 Page ${currentPage}: Found ${foundOnPage} job IDs.`);

      // Next Page
      const nextButton = await page.$(`button[aria-label="Page ${currentPage + 1}"], li[data-test-pagination-page-btn="${currentPage + 1}"] button`);
      
      if (nextButton) {
        await nextButton.scrollIntoViewIfNeeded();
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
  }

  // Remove duplicate job IDs (some might be promoted in multiple pages/countries)
  const uniqueJobs = [];
  const seenIds = new Set();
  for (const job of jobIds) {
    if (!seenIds.has(job.id)) {
      seenIds.add(job.id);
      uniqueJobs.push(job);
    }
  }

  console.log(`\n✅ Discovery complete. Found ${uniqueJobs.length} unique job IDs to process.`);
  await page.close(); // Close discovery page

  // ─── Phase 2: Concurrent Extraction ──────────────────────────────────
  console.log(`\n🚀 Starting concurrent extraction (Concurrency = ${CONCURRENCY})...`);
  
  let processedCount = 0;

  async function processJob(jobMeta) {
    const { id, country } = jobMeta;
    const workerPage = await context.newPage();
    
    // We will listen for new targets directly from this page's apply button
    let extractedApplyUrl = null;
    
    const pageTargetCreatedHandler = async (target) => {
      if (target.type() === 'page') {
        const newPage = await target.page();
        if (newPage) {
          try {
            await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
            extractedApplyUrl = newPage.url();
            await newPage.close();
          } catch(e) {
            extractedApplyUrl = newPage.url();
            try { await newPage.close(); } catch(_) {}
          }
        }
      }
    };
    
    // Attach listener to browser context, filtering for this worker's actions
    // However, since we are concurrent, any apply button click across the 5 pages will trigger this.
    // To isolate, we rely on the specific `waitForEvent('page')` instead!
    
    try {
      await workerPage.goto(`https://www.linkedin.com/jobs/view/${id}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await sleep(MEDIUM);
      
      const titleEl = await workerPage.$(".job-details-jobs-unified-top-card__job-title, h1.t-24");
      const companyEl = await workerPage.$(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
      const locationEl = await workerPage.$(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet");
      
      const title = titleEl ? (await titleEl.innerText()).trim() : "Unknown";
      const company = companyEl ? (await companyEl.innerText()).trim() : "Unknown";
      const location = locationEl ? (await locationEl.innerText()).trim() : country;
      
      const applyButton = await workerPage.$('button.jobs-apply-button');
      
      if (!applyButton) {
        console.log(`   [${processedCount+1}/${uniqueJobs.length}] ⏭️ No apply button found for ${id}.`);
        await workerPage.close();
        processedCount++;
        return;
      }
      
      const buttonText = (await applyButton.innerText()).trim();
      if (buttonText.toLowerCase().includes("easy apply")) {
        console.log(`   [${processedCount+1}/${uniqueJobs.length}] ⏭️ Easy apply skipped: ${title} @ ${company}`);
        await workerPage.close();
        processedCount++;
        return;
      }

      // Wait for the new page event concurrently with the click
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        applyButton.click({ timeout: 5000 }).catch(() => {})
      ]);

      if (newPage) {
        try {
          await newPage.waitForLoadState("domcontentloaded", { timeout: 10000 });
          let cleanUrl = newPage.url();
          // Clean redirect
          try {
            const parsed = new URL(cleanUrl);
            if (parsed.hostname.includes("linkedin.com")) {
              const dest = parsed.searchParams.get("url") || parsed.searchParams.get("dest");
              if (dest) cleanUrl = decodeURIComponent(dest);
            }
          } catch (_) {}
          
          extractedApplyUrl = cleanUrl;
          await newPage.close();
        } catch(e) {
           extractedApplyUrl = newPage.url();
           try { await newPage.close(); } catch(_) {}
        }
      } else {
        // Check if redirect happened on the same page
        if (!workerPage.url().includes("linkedin.com/jobs/view")) {
          extractedApplyUrl = workerPage.url();
        } else {
          // Modal check
          const modalLink = await workerPage.$('.jobs-apply-button__redirect-url, a[href*="apply"], .artdeco-modal a[target="_blank"]');
          if (modalLink) {
             extractedApplyUrl = await modalLink.getAttribute('href');
          }
        }
      }

      if (extractedApplyUrl && !existingApplyUrls.has(extractedApplyUrl)) {
        console.log(`   [${processedCount+1}/${uniqueJobs.length}] ✅ Captured: ${title} @ ${company}`);
        collectedJobs.push({
          title,
          company,
          location,
          applyUrl: extractedApplyUrl,
          linkedinUrl: `https://www.linkedin.com/jobs/view/${id}/`,
          scrapedAt: new Date().toISOString()
        });
        existingApplyUrls.add(extractedApplyUrl);
        saveResults(collectedJobs);
      } else if (existingApplyUrls.has(extractedApplyUrl)) {
        console.log(`   [${processedCount+1}/${uniqueJobs.length}] 🔄 Duplicate URL skipped: ${title}`);
      } else {
        console.log(`   [${processedCount+1}/${uniqueJobs.length}] ⚠️ Failed to extract URL for ${title}`);
      }

    } catch (e) {
      console.log(`   [${processedCount+1}/${uniqueJobs.length}] ❌ Error processing ${id}: ${e.message}`);
    } finally {
      processedCount++;
      try { await workerPage.close(); } catch(e) {}
    }
  }

  // Concurrency Queue Runner
  async function runPool(jobs, concurrency) {
    const queue = [...jobs];
    const workers = new Array(concurrency).fill(Promise.resolve());
    
    for (let i = 0; i < queue.length; i++) {
      const workerIndex = i % concurrency;
      workers[workerIndex] = workers[workerIndex].then(async () => {
        await processJob(queue[i]);
        // Add a random delay between 2-4 seconds to avoid tripping anti-bot
        await sleep(Math.floor(Math.random() * 2000) + 2000);
      });
    }
    
    await Promise.all(workers);
  }

  await runPool(uniqueJobs, CONCURRENCY);

  console.log(`\n🎉 Extraction Complete! Total valid jobs collected: ${collectedJobs.length}`);
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

})();
