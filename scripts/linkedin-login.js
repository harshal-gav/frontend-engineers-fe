#!/usr/bin/env node
/**
 * Interactive LinkedIn Login Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script to log in to LinkedIn manually using Playwright.
 * It opens Chromium, allows you to log into your NEW LinkedIn account,
 * and saves the full authenticated session (cookies + localStorage)
 * into `data/linkedin-auth.json`.
 * 
 * Usage:
 *   node scripts/linkedin-login.js
 *   npm run linkedin:login
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_DIR, 'linkedin-auth.json');

(async () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('\n🚀 Starting Chromium browser for LinkedIn login...');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
  } catch (err) {
    console.log('⚠️  Navigation timed out or redirected, continuing...');
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🔐  LOG IN TO LINKEDIN MANUALLY IN THE OPEN BROWSER WINDOW   ║');
  console.log('║                                                                ║');
  console.log('║  1. Sign in with your NEW LinkedIn account.                    ║');
  console.log('║  2. Complete any 2FA/verification prompt if shown.             ║');
  console.log('║  3. Once you see your LinkedIn feed or homepage, come back    ║');
  console.log('║     here to this terminal and press [ENTER] to save session.   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Wait for the user to press Enter in terminal
  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', resolve);
  });

  // Save auth state
  await context.storageState({ path: AUTH_FILE });

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Session successfully saved to:\n   ${AUTH_FILE}`);
  console.log('═'.repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. For local scraping, you can now run:');
  console.log('   npm run scrape:linkedin');
  console.log('\n2. For automated scraping on GitHub Actions:');
  console.log('   - Copy the ENTIRE contents of data/linkedin-auth.json');
  console.log('   - Go to your GitHub repo → Settings → Secrets and variables → Actions');
  console.log('   - Add or update the Repository secret: LINKEDIN_AUTH_JSON');
  console.log('═'.repeat(60) + '\n');

  await browser.close();
  process.exit(0);
})();
