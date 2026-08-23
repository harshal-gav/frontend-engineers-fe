/**
 * linkedin-login.js
 * ─────────────────
 * Run this ONCE to log in to LinkedIn manually.
 * It will save your session (cookies + localStorage) to data/linkedin-auth.json
 * so the scraper can reuse it without logging in again.
 *
 * Usage:  node scripts/linkedin-login.js
 */
const { chromium } = require("playwright");
const path = require("path");

const AUTH_FILE = path.join(__dirname, "..", "data", "linkedin-auth.json");

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (_) {
    console.log("⚠️  Page load timed out, but continuing...");
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  🔐  LOG IN TO LINKEDIN MANUALLY IN THE BROWSER ║");
  console.log("║                                                  ║");
  console.log("║  Once you see your LinkedIn feed, come back      ║");
  console.log("║  here and press ENTER to save the session.       ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // Wait for the user to press Enter in the terminal
  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", resolve);
  });

  // Save auth state
  await context.storageState({ path: AUTH_FILE });
  console.log(`\n✅ Auth state saved to: ${AUTH_FILE}`);
  console.log("   You can now run the scraper with: node scripts/linkedin-scraper.js\n");

  await browser.close();
  process.exit(0);
})();
