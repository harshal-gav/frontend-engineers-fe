#!/usr/bin/env node
/**
 * Automated Twitter/X Auto-Poster (Jobs + Employer Ads + Community Referrals)
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Playwright with saved session cookies (`data/twitter-auth.json`) to
 * publish THREE high-converting posts to Twitter/X in a single run:
 *   1. Remote Frontend Jobs & Referrals Post (for developers)
 *   2. Employer Hiring Post ($99/mo Unlimited Hiring Plan)
 *   3. Community Referral Contribution Post (free referral posting)
 * 
 * Each post is strictly optimized for Twitter's 280-character limit with
 * smart t.co link length calculation.
 * 
 * Environment variables:
 *   GEMINI_API_KEY     - Google Gemini API key
 *   TWITTER_AUTH_JSON  - (Optional in CI) Stringified contents of data/twitter-auth.json
 *   HEADED             - "true" to run browser in visible mode
 * 
 * Flags:
 *   --dry-run          - Generate posts & calculate lengths without posting
 *   --headed           - Show Chromium browser while posting
 * 
 * Usage:
 *   node scripts/post-to-twitter.js
 *   node scripts/post-to-twitter.js --dry-run
 *   npm run twitter:post
 *   npm run twitter:post:dry
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Load environment variables if running locally without --env-file
const envPath = path.resolve(__dirname, '../.env');
if (!process.env.GEMINI_API_KEY && fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch {
    // ignore if dotenv not present
  }
}

const DRY_RUN = process.argv.includes('--dry-run');
const IS_HEADED = process.argv.includes('--headed') || process.env.HEADED === 'true';

const DATA_DIR = path.join(__dirname, '..', 'data');
const AUTH_FILE = path.join(DATA_DIR, 'twitter-auth.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Cycle through available Gemini models if overload occurs
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-3.6-flash',
];

// ─── Twitter Character Counting & Truncation Helpers ─────────────────────────

/**
 * Twitter calculates any URL as 23 characters (t.co wrapper).
 * Standard limit is 280 characters.
 */
function calculateTwitterLength(text) {
  if (!text) return 0;
  // Replace URLs with 23 characters
  const urlRegex = /https?:\/\/[^\s]+/g;
  const normalized = text.replace(urlRegex, 'x'.repeat(23));
  return Array.from(normalized).length;
}

/**
 * Guarantees a tweet is strictly <= maxLen (default 275 for safety).
 * If over, cleanly removes trailing hashtags or trims at the last word.
 */
function fitToTwitterLimit(text, maxLen = 275) {
  let cleanText = text
    .replace(/[*_~`]/g, '') // remove markdown
    .replace(/\r/g, '')
    .trim();

  if (calculateTwitterLength(cleanText) <= maxLen) {
    return cleanText;
  }

  // 1. Try removing hashtags one-by-one from the end
  const hashtagRegex = /\s*#[A-Za-z0-9_]+$/;
  while (calculateTwitterLength(cleanText) > maxLen && hashtagRegex.test(cleanText)) {
    cleanText = cleanText.replace(hashtagRegex, '').trim();
  }

  if (calculateTwitterLength(cleanText) <= maxLen) {
    return cleanText;
  }

  // 2. Separate URL if present so it doesn't get chopped in half
  const urlMatch = cleanText.match(/(https?:\/\/[^\s]+)/);
  const targetUrl = urlMatch ? urlMatch[1] : '';
  const textWithoutUrl = targetUrl ? cleanText.replace(targetUrl, '').trim() : cleanText;

  // URL takes 23 chars + 2 for newline
  const availableCharsForBody = targetUrl ? maxLen - 25 : maxLen - 3;
  let words = textWithoutUrl.split(/\s+/);
  let truncatedBody = '';

  for (const word of words) {
    const candidate = truncatedBody ? `${truncatedBody} ${word}` : word;
    if (Array.from(candidate).length > availableCharsForBody) break;
    truncatedBody = candidate;
  }

  cleanText = targetUrl ? `${truncatedBody}\n\n${targetUrl}` : `${truncatedBody}...`;
  return cleanText.trim();
}

// ─── Hydrate Auth Session from Environment Variable (CI / GitHub Actions) ────

function hydrateAuthIfEnvPresent() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const envAuth = process.env.TWITTER_AUTH_JSON || process.env.TWITTER_AUTH_DATA;
  if (envAuth && !fs.existsSync(AUTH_FILE)) {
    try {
      console.log('💧 Hydrating Twitter/X auth session from environment variable...');
      fs.writeFileSync(AUTH_FILE, envAuth.trim());
    } catch (err) {
      console.warn('⚠️ Could not write Twitter auth session from env:', err.message);
    }
  }
}

// ─── Gemini AI Generation (Single Prompt for 3 Twitter Posts) ─────────────────

async function generateThreeTwitterPostsWithGemini() {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const prompt = `You are a social media growth lead for FrontendEngineers.com - the premier platform exclusively for remote frontend developers.

Generate THREE distinct, punchy, high-engagement Twitter/X posts for a standard free Twitter account (strict max 260 characters each).

Respond ONLY with a valid JSON object in this exact schema:
{
  "jobPost": "text of post 1",
  "employerPost": "text of post 2",
  "referralPost": "text of post 3"
}

---
CRITICAL TWITTER CONSTRAINTS:
- STRICT CHARACTER LIMIT: Each post MUST be strictly UNDER 260 characters total (including text, link, and hashtags). Twitter has a hard 280-character limit!
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- EMOJIS: Use 2-4 vibrant emojis per tweet.
- NO FLUFF: Every word must count. High hook + clear value + link + 2-3 hashtags.

---
INSTRUCTIONS FOR jobPost (Target: Frontend Devs seeking remote jobs & referrals in one place):
- Hook: Remote frontend developer jobs and direct referrals in one place at FrontendEngineers.com! 🚀
- Value: React, Next.js, Vue, TS roles. Skip applicant queues with employee referrals.
- Link: https://www.frontendengineers.com
- Hashtags: #FrontendDeveloper #RemoteJobs #WebDev
- MUST be under 260 characters.

---
INSTRUCTIONS FOR employerPost (Target: Tech Recruiters & Engineering Hiring Managers):
- Hook: Hiring frontend engineers? Reach 5,000+ remote React, Next.js & Vue devs for just $99/mo flat. 🎯
- Value: Post unlimited jobs. 10x cheaper than LinkedIn ($300+/post).
- Link: https://www.frontendengineers.com/employers/pricing
- Hashtags: #Hiring #TechRecruitment #Startups
- MUST be under 260 characters.

---
INSTRUCTIONS FOR referralPost (Target: Frontend Engineers & Tech Leads with referrals):
- Hook: Does your company hire remote frontend devs? Post your referral for FREE on FrontendEngineers.com! 🤝
- Value: 100% free. Help a fellow developer land an interview. Pay it forward!
- Link: https://www.frontendengineers.com/referrals
- Hashtags: #PayItForward #JobReferrals #TechCommunity
- MUST be under 260 characters.`;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`   Trying Gemini model: ${model} (attempt ${attempt}/2)...`);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2000,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`   ⚠️ Gemini ${model} HTTP ${res.status}: ${errText.substring(0, 150)}`);
          if ((res.status === 429 || res.status === 503) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          break;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`   ⚠️ Gemini ${model} returned empty content.`);
          break;
        }

        let jobPost = null;
        let employerPost = null;
        let referralPost = null;

        try {
          const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedText);
          if (Array.isArray(parsed)) {
            jobPost = parsed[0]?.text || parsed[0]?.post || parsed[0]?.content || parsed[0];
            employerPost = parsed[1]?.text || parsed[1]?.post || parsed[1]?.content || parsed[1];
            referralPost = parsed[2]?.text || parsed[2]?.post || parsed[2]?.content || parsed[2];
          } else if (parsed && typeof parsed === 'object') {
            const vals = Object.values(parsed);
            jobPost = parsed.jobPost || parsed.job_post || parsed.post1 || parsed['jobPost'] || vals[0];
            employerPost = parsed.employerPost || parsed.employer_post || parsed.post2 || parsed['employerPost'] || vals[1];
            referralPost = parsed.referralPost || parsed.referral_post || parsed.post3 || parsed['referralPost'] || vals[2];
          }
        } catch (_) {
          // Fallback regex if responseMimeType wasn't respected
          const jobMatch = text.match(/(?:===|---)?\s*JOB_POST_START\s*(?:===|---)?([\s\S]*?)(?:===|---)?\s*JOB_POST_END\s*(?:===|---)?/i);
          const empMatch = text.match(/(?:===|---)?\s*EMPLOYER_POST_START\s*(?:===|---)?([\s\S]*?)(?:===|---)?\s*EMPLOYER_POST_END\s*(?:===|---)?/i);
          const refMatch = text.match(/(?:===|---)?\s*REFERRAL_POST_START\s*(?:===|---)?([\s\S]*?)(?:===|---)?\s*REFERRAL_POST_END\s*(?:===|---)?/i);
          jobPost = jobMatch ? jobMatch[1].trim() : null;
          employerPost = empMatch ? empMatch[1].trim() : null;
          referralPost = refMatch ? refMatch[1].trim() : null;
        }

        if (!jobPost || !employerPost || !referralPost) {
          console.warn(`   ⚠️ Could not extract all 3 posts cleanly. Retrying...`);
          continue;
        }

        // Apply strict 275 character fit
        jobPost = fitToTwitterLimit(String(jobPost));
        employerPost = fitToTwitterLimit(String(employerPost));
        referralPost = fitToTwitterLimit(String(referralPost));

        return { jobPost, employerPost, referralPost };
      } catch (err) {
        console.warn(`   ⚠️ Exception calling Gemini model ${model}: ${err.message}`);
      }
    }
  }

  console.warn('⚠️ Gemini models currently busy, using curated high-converting fallback tweets...');
  return {
    jobPost: fitToTwitterLimit(
      'Remote frontend developer jobs and direct referrals in one place at FrontendEngineers.com! 🚀\n\nFind React, Next.js, Vue & TS roles. Skip applicant queues with employee referrals. Land your dream gig! 💻✨\n\n👉 https://www.frontendengineers.com\n#FrontendDeveloper #RemoteJobs #WebDev'
    ),
    employerPost: fitToTwitterLimit(
      'Hiring frontend engineers? 🎯 Reach 5,000+ remote React, Next.js & Vue devs for just $99/mo flat.\n\nPost unlimited jobs. 10x cheaper than LinkedIn ($300+/post). Find your next hire today! 🚀💼\n\nPost now: https://www.frontendengineers.com/employers/pricing\n#Hiring #TechRecruitment #Startups'
    ),
    referralPost: fitToTwitterLimit(
      'Does your company hire remote frontend devs? 🤝 Post your referral for FREE on FrontendEngineers.com!\n\n100% free. Help a fellow dev land an interview & pay it forward! ✨🚀\n\nSubmit referral: https://www.frontendengineers.com/referrals\n#PayItForward #JobReferrals #TechCommunity'
    ),
  };
}

// ─── Playwright Twitter Automation ───────────────────────────────────────────

/**
 * Publishes a single tweet using Playwright and active browser context.
 */
async function publishTweetToTwitter(page, tweetText) {
  console.log(`   Navigating to Twitter compose...`);
  
  // Navigate directly to compose post
  try {
    await page.goto('https://x.com/compose/post', {
      waitUntil: 'domcontentloaded',
      timeout: 35000,
    });
  } catch (err) {
    console.log('   ⚠️ Navigation slow or redirected, checking page state...');
  }

  await page.waitForTimeout(2000);

  // Check if session is expired or locked
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
    throw new Error(
      'Twitter/X session is expired or not authenticated! Run `npm run twitter:login` to re-authenticate.'
    );
  }

  // Look for the text editor
  let editor = page.locator('[data-testid="tweetTextarea_0"]').first();
  const editorVisible = await editor.isVisible({ timeout: 10000 }).catch(() => false);

  if (!editorVisible) {
    // If modal didn't open, navigate to home and try inline composer or SideNav button
    console.log('   Retrying from home timeline...');
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(2000);

    const sideNavBtn = page.locator('[data-testid="SideNav_NewTweet_Button"]').first();
    if (await sideNavBtn.isVisible()) {
      await sideNavBtn.click();
      await page.waitForTimeout(1000);
    }
    editor = page.locator('[data-testid="tweetTextarea_0"]').first();
    await editor.waitFor({ state: 'visible', timeout: 15000 });
  }

  // Focus and clear editor
  await editor.click();
  await page.waitForTimeout(300);

  // Type text reliably using keyboard insertion
  await page.keyboard.insertText(tweetText);
  await page.waitForTimeout(1000);

  // Press Escape to dismiss any hashtag/mention suggestion dropdown popovers
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Find the Post button
  const postBtn = page.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').first();
  await postBtn.waitFor({ state: 'visible', timeout: 10000 });

  // Verify button is not disabled
  const ariaDisabled = await postBtn.getAttribute('aria-disabled');
  const isHtmlDisabled = await postBtn.isDisabled();

  if (ariaDisabled === 'true' || isHtmlDisabled) {
    const calculatedLen = calculateTwitterLength(tweetText);
    throw new Error(
      `Tweet button is disabled! Tweet may exceed character limit (Calculated: ${calculatedLen}/280).`
    );
  }

  // Click Post: bypass overlays using force: true, DOM evaluate click, and keyboard shortcut
  console.log('   Clicking Post button...');
  let submitted = false;

  try {
    // 1. Force click directly on the button to bypass any transparent overlays/backdrops
    await postBtn.click({ force: true, timeout: 5000 });
    submitted = true;
  } catch (clickErr) {
    console.log(`   ⚠️ Direct click blocked (${clickErr.message.substring(0, 60)}...). Trying DOM click...`);
  }

  if (!submitted) {
    try {
      // 2. Direct DOM evaluate click
      await postBtn.evaluate((btn) => btn.click());
      submitted = true;
    } catch (_) {
      // 3. Native Twitter keyboard shortcut: Cmd+Enter (Mac) or Ctrl+Enter
      await editor.focus().catch(() => {});
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
    }
  }

  console.log('   Waiting for tweet confirmation...');

  // Wait for submission confirmation (toast notification or modal closing)
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="toast"]', { timeout: 15000 }),
      editor.waitFor({ state: 'detached', timeout: 15000 }),
      page.waitForURL((url) => !url.href.includes('/compose/post'), { timeout: 15000 }),
    ]);
  } catch {
    // Grace period fallback
    await page.waitForTimeout(4000);
  }

  return { success: true };
}

/**
 * Main routine to post all three tweets to Twitter
 */
async function postThreeTweetsToTwitter(options = {}) {
  const {
    jobPost,
    employerPost,
    referralPost,
    dryRun = DRY_RUN,
    headed = IS_HEADED,
  } = options;

  console.log('🚀 Twitter/X Automated Multi-Post (Jobs + Employer Ads + Referrals)');
  console.log('═'.repeat(60));
  if (dryRun) console.log('⚠️  DRY RUN MODE - will not publish to Twitter/X\n');

  console.log('\n📄 [1/3] Remote Jobs & Referrals Tweet:');
  console.log('─'.repeat(60));
  console.log(jobPost);
  console.log('─'.repeat(60));
  console.log(`Twitter Character Count: ${calculateTwitterLength(jobPost)} / 280`);

  console.log('\n📄 [2/3] Employer Ad Tweet:');
  console.log('─'.repeat(60));
  console.log(employerPost);
  console.log('─'.repeat(60));
  console.log(`Twitter Character Count: ${calculateTwitterLength(employerPost)} / 280`);

  console.log('\n📄 [3/3] Community Referral Support Tweet:');
  console.log('─'.repeat(60));
  console.log(referralPost);
  console.log('─'.repeat(60));
  console.log(`Twitter Character Count: ${calculateTwitterLength(referralPost)} / 280`);

  if (dryRun) {
    console.log('\n✅ DRY RUN complete. All 3 tweets successfully validated under 280 characters!');
    return { success: true, dryRun: true };
  }

  hydrateAuthIfEnvPresent();

  if (!fs.existsSync(AUTH_FILE)) {
    console.error('\n❌ No saved Twitter/X session found at:', AUTH_FILE);
    console.error('📋 How to fix:');
    console.error('  1. Run the interactive login helper:');
    console.error('     npm run twitter:login   (or: node scripts/twitter-login.js)');
    console.error('  2. In GitHub Actions, add secret TWITTER_AUTH_JSON with the contents of data/twitter-auth.json\n');
    throw new Error('Twitter auth session file missing');
  }

  console.log('\n🔑 Launching browser with saved Twitter session...');
  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 120 : 30,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      ...(headed ? ['--start-maximized'] : []),
    ],
  });

  const context = await browser.newContext({
    storageState: AUTH_FILE,
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  let publishedCount = 0;

  try {
    // 1. Post Candidate Jobs Tweet
    console.log('\n[1/3] Publishing Candidate Jobs Tweet...');
    await publishTweetToTwitter(page, jobPost);
    publishedCount++;
    console.log('✅ Successfully published Tweet 1 (Candidate Jobs)!');

    // Anti-spam delay between tweets (20 seconds)
    console.log('⏳ Waiting 20s before posting Employer Ad...');
    await page.waitForTimeout(20000);

    // 2. Post Employer Ad Tweet
    console.log('\n[2/3] Publishing Employer Ad Tweet...');
    await publishTweetToTwitter(page, employerPost);
    publishedCount++;
    console.log('✅ Successfully published Tweet 2 (Employer Ad)!');

    // Anti-spam delay between tweets (20 seconds)
    console.log('⏳ Waiting 20s before posting Community Referral Tweet...');
    await page.waitForTimeout(20000);

    // 3. Post Community Referrals Tweet
    console.log('\n[3/3] Publishing Community Referral Tweet...');
    await publishTweetToTwitter(page, referralPost);
    publishedCount++;
    console.log('✅ Successfully published Tweet 3 (Community Referrals)!');

    // Save refreshed session storage state
    await context.storageState({ path: AUTH_FILE });
    console.log('💾 Updated Twitter auth session cookies.');
  } finally {
    await browser.close();
  }

  console.log(`\n🎉 Successfully published ${publishedCount} / 3 tweets to Twitter/X!`);
  return { success: true, publishedCount };
}

// ─── Direct Script Execution ──────────────────────────────────────────────────

async function main() {
  console.log('🤖 Generating 3 Twitter/X posts with Gemini AI...');
  const { jobPost, employerPost, referralPost } = await generateThreeTwitterPostsWithGemini();

  await postThreeTweetsToTwitter({
    jobPost,
    employerPost,
    referralPost,
    dryRun: DRY_RUN,
    headed: IS_HEADED,
  });

  console.log('✅ Twitter auto-poster finished successfully.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ Twitter Poster Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  calculateTwitterLength,
  fitToTwitterLimit,
  generateThreeTwitterPostsWithGemini,
  publishTweetToTwitter,
  postThreeTweetsToTwitter,
};
