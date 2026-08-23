const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────
const SEARCH_QUERY = "frontend engineer";
const LOCATION = "United States";
const OUTPUT_FILE = path.join(__dirname, "..", "data", "linkedin-jobs.json");
const AUTH_FILE = path.join(__dirname, "..", "data", "linkedin-auth.json");

// How long to wait between actions (ms) — keeps things human-like
const SLOW = 800;
const MEDIUM = 1500;
const LONG = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveResults(jobs) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jobs, null, 2));
  console.log(`💾 Saved ${jobs.length} jobs to ${OUTPUT_FILE}`);
}

// ─── Main ─────────────────────────────────────────────────────────────
(async () => {
  const collectedJobs = [];

  // ─── Step 0: Check for saved auth state ────────────────────────────
  const hasAuth = fs.existsSync(AUTH_FILE);

  if (!hasAuth) {
    console.log("❌ No saved LinkedIn session found at:", AUTH_FILE);
    console.log("   Run this first to log in and save your session:\n");
    console.log("     node scripts/linkedin-login.js\n");
    process.exit(1);
  }

  console.log("🔑 Loading saved LinkedIn session from:", AUTH_FILE);

  // Launch headed Chromium so you can watch
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ["--start-maximized"],
  });

  // Load the saved auth state (cookies + localStorage)
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
      console.log("  🔗 New tab opened:", latestNewPageUrl);
      await newPage.close();
    } catch (e) {
      latestNewPageUrl = newPage.url();
      console.log("  🔗 New tab (partial load):", latestNewPageUrl);
      try { await newPage.close(); } catch (_) {}
    }
  });

  // ─── Step 1: Verify session is still valid ─────────────────────────
  console.log("🔐 Verifying session...");
  try {
    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (_) {
    console.log("  ⚠️  Feed navigation timed out, continuing...");
  }
  await sleep(LONG);

  // Check if we're actually on the feed (logged in) or got redirected to login
  if (page.url().includes("/login") || page.url().includes("/authwall")) {
    console.log("❌ Session expired! Please re-login:");
    console.log("   Run:  node scripts/linkedin-login.js\n");
    await browser.close();
    process.exit(1);
  }
  console.log("✅ Session is valid! Logged in as an authenticated user.");
  await sleep(MEDIUM);

  // ─── Step 2: Navigate to Jobs search ───────────────────────────────
  console.log("🔍 Navigating to Jobs...");

  // Build the LinkedIn jobs search URL with filters pre-applied:
  //   f_WT=2      → Remote
  //   location    → United States
  //   keywords    → frontend engineer
  //   sortBy=DD   → Most recent
  const jobsUrl = new URL("https://www.linkedin.com/jobs/search/");
  jobsUrl.searchParams.set("keywords", SEARCH_QUERY);
  jobsUrl.searchParams.set("location", LOCATION);
  jobsUrl.searchParams.set("f_WT", "2"); // Remote filter
  // Removed "sortBy=DD" so it defaults to Relevance

  try {
    await page.goto(jobsUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (e) {
    console.log("  ⚠️  Jobs page navigation timed out, continuing anyway:", e.message);
  }
  await sleep(LONG);

  // ─── Step 3: Process pages ─────────────────────────────────────────
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    console.log(`\n📄 ── Page ${currentPage} ──────────────────────────`);
    await sleep(MEDIUM);

    // Scroll the job list sidebar to load all cards
    const listContainer = await page.$(
      ".jobs-search-results-list, .scaffold-layout__list"
    );
    if (listContainer) {
      for (let i = 0; i < 8; i++) {
        await listContainer.evaluate((el) =>
          el.scrollBy({ top: 300, behavior: "smooth" })
        );
        await sleep(400);
      }
      // Scroll back to top
      await listContainer.evaluate((el) => el.scrollTo({ top: 0 }));
      await sleep(SLOW);
    }

    // Grab all job card links on this page
    const jobCards = await page.$$(
      '.job-card-container__link, .jobs-search-results__list-item a.job-card-list__title, li.jobs-search-results__list-item .job-card-container--clickable, [data-job-id]'
    );

    console.log(`   Found ${jobCards.length} job cards on this page.`);

    for (let i = 0; i < jobCards.length; i++) {
      try {
        // Re-query cards each iteration (DOM can change after clicks)
        const cards = await page.$$(
          '.job-card-container__link, .jobs-search-results__list-item a.job-card-list__title, li.jobs-search-results__list-item .job-card-container--clickable, [data-job-id]'
        );
        if (i >= cards.length) break;

        const card = cards[i];
        await card.scrollIntoViewIfNeeded();
        await sleep(SLOW);
        await card.click();
        await sleep(MEDIUM);

        // ── Extract job details from the right-side panel ──
        const titleEl = await page.$(
          ".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, h2.t-24"
        );
        const companyEl = await page.$(
          ".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name"
        );
        const locationEl = await page.$(
          ".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet"
        );

        const title = titleEl
          ? (await titleEl.innerText()).trim()
          : "Unknown Title";
        const company = companyEl
          ? (await companyEl.innerText()).trim()
          : "Unknown Company";
        const location = locationEl
          ? (await locationEl.innerText()).trim()
          : "";

        console.log(`\n   [${i + 1}/${jobCards.length}] ${title} @ ${company}`);
        console.log(`       📍 ${location}`);

        // ── Check for Apply button (NOT Easy Apply) ──
        // We look specifically in the job details panel (right side) for the apply button.
        // LinkedIn's Apply button has class "jobs-apply-button" and lives inside
        // the job details container. We avoid matching filter/toolbar buttons.

        const applyButton = await page.$(
          '.jobs-details__main-content button.jobs-apply-button, ' +
          '.job-details-jobs-unified-top-card__container--two-pane button.jobs-apply-button, ' +
          '.jobs-unified-top-card button.jobs-apply-button, ' +
          '.jobs-details button.jobs-apply-button, ' +
          '.job-details-jobs-unified-top-card__content button.jobs-apply-button'
        );

        if (!applyButton) {
          // Fallback: try to find any visible button whose text is exactly "Apply"
          const allButtons = await page.$$('button');
          let foundApply = null;
          for (const btn of allButtons) {
            try {
              const txt = (await btn.innerText()).trim();
              const isVisible = await btn.isVisible();
              if (isVisible && txt === "Apply") {
                foundApply = btn;
                break;
              }
            } catch (_) {}
          }
          
          if (!foundApply) {
            console.log("       ⏭️  No Apply button found — skipping.");
            continue;
          }
          
          // Use the fallback
          const buttonText = (await foundApply.innerText()).trim();
          console.log(`       🖱️  Clicking "${buttonText}" (fallback)...`);
          latestNewPageUrl = null;
          await foundApply.click({ timeout: 5000 }).catch(() => {});
          await sleep(LONG);
        } else {
          const buttonText = (await applyButton.innerText()).trim();

          if (buttonText.toLowerCase().includes("easy apply")) {
            console.log("       ⏭️  Easy Apply — skipping.");
            continue;
          }

          console.log(`       🖱️  Clicking "${buttonText}"...`);

          // Reset the tracker
          latestNewPageUrl = null;

          // Click the Apply button — it should open a new tab
          await applyButton.click({ timeout: 5000 }).catch(() => {});
          await sleep(LONG);
        }

        // If a new tab was caught by our listener
        if (latestNewPageUrl) {
          // Clean the URL (remove LinkedIn tracking params)
          let cleanUrl = latestNewPageUrl;
          try {
            const parsed = new URL(latestNewPageUrl);
            // Some LinkedIn apply links go through a redirect
            if (parsed.hostname.includes("linkedin.com")) {
              const dest =
                parsed.searchParams.get("url") ||
                parsed.searchParams.get("dest") ||
                parsed.searchParams.get("redirectUrl");
              if (dest) cleanUrl = decodeURIComponent(dest);
            }
          } catch (_) {}

          console.log(`       ✅ Apply URL: ${cleanUrl}`);

          collectedJobs.push({
            title,
            company,
            location,
            applyUrl: cleanUrl,
            linkedinUrl: page.url(),
            scrapedAt: new Date().toISOString(),
          });

          // Save after every job (in case of crash)
          saveResults(collectedJobs);
        } else {
          // Fallback: check if the page itself navigated (single-tab apply)
          const currentUrl = page.url();
          if (!currentUrl.includes("linkedin.com/jobs")) {
            console.log(`       ✅ Apply URL (redirect): ${currentUrl}`);
            collectedJobs.push({
              title,
              company,
              location,
              applyUrl: currentUrl,
              linkedinUrl: "",
              scrapedAt: new Date().toISOString(),
            });
            saveResults(collectedJobs);
            await page.goBack();
            await sleep(MEDIUM);
          } else {
            // Maybe a modal opened instead of a new tab
            const modalLink = await page.$(
              '.jobs-apply-button__redirect-url, a[href*="apply"], .artdeco-modal a[target="_blank"]'
            );
            if (modalLink) {
              const href = await modalLink.getAttribute("href");
              if (href) {
                console.log(`       ✅ Apply URL (modal): ${href}`);
                collectedJobs.push({
                  title,
                  company,
                  location,
                  applyUrl: href,
                  linkedinUrl: page.url(),
                  scrapedAt: new Date().toISOString(),
                });
                saveResults(collectedJobs);
              }
            } else {
              console.log(
                "       ⚠️  Could not capture apply URL — no new tab or redirect detected."
              );
            }

            // Close any modal that might have opened
            const closeBtn = await page.$(
              'button[aria-label="Dismiss"], .artdeco-modal__dismiss'
            );
            if (closeBtn) {
              await closeBtn.click();
              await sleep(SLOW);
            }
          }
        }
      } catch (err) {
        console.log(`       ❌ Error processing card ${i}: ${err.message}`);
      }
    }

    // ─── Pagination ──────────────────────────────────────────────────
    console.log(`\n   🔄 Looking for next page...`);

    // LinkedIn pagination uses <li> elements with page numbers
    const nextButton = await page.$(
      `button[aria-label="Page ${currentPage + 1}"], li[data-test-pagination-page-btn="${currentPage + 1}"] button`
    );

    if (nextButton) {
      console.log(`   ➡️  Going to page ${currentPage + 1}`);
      await nextButton.scrollIntoViewIfNeeded();
      await sleep(SLOW);
      await nextButton.click();
      currentPage++;
      await sleep(LONG);
    } else {
      // Try the generic "next" arrow
      const nextArrow = await page.$(
        'button[aria-label="Next"], button.artdeco-pagination__button--next'
      );
      if (nextArrow && (await nextArrow.isEnabled())) {
        console.log(`   ➡️  Going to next page (arrow)`);
        await nextArrow.click();
        currentPage++;
        await sleep(LONG);
      } else {
        console.log("   🏁 No more pages — done!");
        hasMorePages = false;
      }
    }
  }

  // ─── Final save & cleanup ──────────────────────────────────────────
  saveResults(collectedJobs);
  console.log(`\n🎉 Done! Collected ${collectedJobs.length} apply links total.`);
  console.log(`📁 Results saved to: ${OUTPUT_FILE}`);

  // Refresh the saved auth state so next run doesn't need login
  await context.storageState({ path: AUTH_FILE });
  console.log("🔑 Session refreshed and saved for next run.");

  // Keep browser open for 10s so you can review
  console.log("   Browser will close in 10 seconds...");
  await sleep(10000);
  await browser.close();
})();
