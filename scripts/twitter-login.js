#!/usr/bin/env node
/**
 * Interactive Twitter/X Login Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script to log in to Twitter/X manually using Playwright.
 * It opens Chromium, allows you to log into your Twitter/X account,
 * and saves the full authenticated session (cookies + localStorage)
 * into `data/twitter-auth.json`.
 * 
 * Usage:
 *   node scripts/twitter-login.js
 *   npm run twitter:login
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_DIR, 'twitter-auth.json');

(async () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('\n🚀 Starting Chromium browser for Twitter/X login...');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  // Stealth script to avoid detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const page = await context.newPage();

  console.log('🌐 Opening Twitter/X login page...');
  try {
    await page.goto('https://x.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
  } catch (err) {
    console.log('⚠️  Navigation timed out or redirected, continuing...');
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🔐  LOG IN TO TWITTER/X MANUALLY IN THE OPEN BROWSER WINDOW   ║');
  console.log('║                                                                ║');
  console.log('║  1. Sign in with your Twitter/X username, email, & password.   ║');
  console.log('║  2. Complete any 2FA/verification code or prompt if shown.     ║');
  console.log('║  3. Once you see your home feed (x.com/home), come back        ║');
  console.log('║     here to this terminal and press [ENTER] to save session.   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Wait for the user to press Enter in terminal
  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', resolve);
  });

  // Save auth state
  await context.storageState({ path: AUTH_FILE });

  const currentUrl = page.url();
  console.log('\n' + '═'.repeat(60));
  if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
    console.warn('⚠️  Warning: Current page still looks like a login page:', currentUrl);
    console.warn('   Please ensure you completed sign-in before running the poster.');
  } else {
    console.log(`✅ Twitter/X session successfully saved to:\n   ${AUTH_FILE}`);
  }
  console.log('═'.repeat(60));

  console.log('\n📋 Next Steps:');
  console.log('1. For local automated posting, you can now run:');
  console.log('   npm run twitter:post:dry   (to test without publishing)');
  console.log('   npm run twitter:post       (to publish all 3 posts)');
  console.log('\n2. For automated posting on GitHub Actions:');
  console.log('   - Copy the ENTIRE contents of data/twitter-auth.json');
  console.log('   - Go to your GitHub repo → Settings → Secrets and variables → Actions');
  console.log('   - Add Repository secret: TWITTER_AUTH_JSON');
  console.log('═'.repeat(60) + '\n');

  await browser.close();
  process.exit(0);
})();
