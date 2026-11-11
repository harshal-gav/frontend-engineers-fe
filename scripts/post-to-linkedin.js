#!/usr/bin/env node
/**
 * Automated LinkedIn Poster (Remote Frontend Jobs, Community Referrals & Employer Hiring)
 * 
 * Generates a high-converting, long-form LinkedIn post modeled after proven top-performing posts:
 *   - MANDATORY FIRST LINE: Catchy hook containing "FrontendEngineers.com" and "remote frontend jobs" + emoji
 *   - DEVELOPER EMPATHY: Solves the frustration of generic job boards and void applications
 *   - HIGH-IMPACT PILLARS:
 *       ⚡ MASSIVE ACCESS FOR FRONTEND JOBS ONLY (no backend noise)
 *       🌍 GO GLOBAL (worldwide remote frontend opportunities in one place)
 *       🛡️ SAFE & ACCURATE (verified roles, zero ghost postings, zero spam)
 *       🎯 DIRECT ATS & EMPLOYEE REFERRALS (Greenhouse/Lever/Ashby + bypass filters)
 *   - PRO LEVERAGE ($9/mo for 1,000+ remote jobs - $0.30/day)
 *   - DETERMINISTIC ACTION LINKS:
 *       🔍 Explore active roles:
 *       https://www.frontendengineers.com
 *       ⚡ Upgrade to PRO access here:
 *       https://www.frontendengineers.com/pricing
 *   - 8 HIGH-PERFORMING HASHTAGS:
 *       #FrontendDeveloper #RemoteJobs #ReactJS #WebDevelopment #FrontendEngineers #JavaScript #TechJobs #WorkFromAnywhere
 * 
 * Flags:
 *   --dry-run    - Generate the post but don't publish to LinkedIn
 *   --short      - Generate a compact post (700-950 chars) instead of standard long-form
 *   --long       - Explicit long-form flag (now standard by default: 1100-1500 chars)
 *   --hourly     - Run in continuous daemon mode, posting once every hour (60 min)
 *   --loop <min> - Run in continuous daemon mode every <min> minutes
 * 
 * Usage:
 *   node scripts/post-to-linkedin.js --dry-run
 *   node scripts/post-to-linkedin.js
 *   node scripts/post-to-linkedin.js --hourly
 */

const fs = require('fs');
const path = require('path');

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
const IS_SHORT = process.argv.includes('--short');
const IS_LONG = !IS_SHORT; // Default to long-form high-performing post structure
const IS_HOURLY = process.argv.includes('--hourly');
const LOOP_ARG_INDEX = process.argv.indexOf('--loop');
const LOOP_INTERVAL_MINUTES = IS_HOURLY
  ? 60
  : (LOOP_ARG_INDEX !== -1 && process.argv[LOOP_ARG_INDEX + 1] ? parseInt(process.argv[LOOP_ARG_INDEX + 1], 10) : null);

// ─── Config ──────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_PERSON_ID = process.env.LINKEDIN_PERSON_ID;
const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY environment variable');
  process.exit(1);
}

// Resilient list of Gemini models to cycle through if quota/overload occurs
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-pro'
];

// High-performing creative themes engineered for maximum viral conversion on LinkedIn
const CREATIVE_THEMES = [
  {
    name: 'All Remote Jobs in One Place - Delete Your 30 Job Tabs',
    angle: 'Developers waste 10-15 hours a week jumping between LinkedIn, Indeed, Wellfound, and company career pages. FrontendEngineers.com aggregates every verified remote frontend role from 100+ sources into one single feed so you never have to visit another platform. Upgrade to Pro for just $9/mo to unlock direct ATS links and referrals.',
    hookStyle: 'Relatable, high-energy hook on deleting 30 job tabs and accessing every remote frontend job in one place.'
  },
  {
    name: 'The $9 Career Investment vs Months of Frustration',
    angle: 'A remote frontend role pays $100k-$200k+. Why spend 6 months unemployed and stressed on broken free boards to save $9? For $0.30/day, Pro unlocks 1,000+ verified remote jobs, direct Greenhouse/Lever/Ashby apply links, and insider referrals in one unified dashboard.',
    hookStyle: 'High-converting ROI reality check comparing a $9 subscription to a 6-figure remote career.'
  },
  {
    name: 'Why You Never Need Another Job Board Again',
    angle: 'Stop juggling 5 different platforms filled with backend clutter, ghost jobs, and expired links. We aggregate verified frontend roles from 100+ sources into one clean hub. For just $9/month, skip the 500-applicant line and apply direct.',
    hookStyle: 'Bold, provocative hook challenging developers to stop hopping between job platforms.'
  },
  {
    name: 'Skip the 500-Applicant ATS Queue for Just $9',
    angle: 'Generic aggregator platforms put you behind 500 candidates who applied days earlier. FrontendEngineers.com brings all top remote frontend jobs into one place and gives you direct ATS links and insider referrals for only $9/month.',
    hookStyle: 'Tactical speed advantage hook on landing remote frontend interviews fast for $9.'
  },
  {
    name: 'Reclaim 15 Hours a Week with All-in-One Aggregation',
    angle: 'Hunting for remote frontend roles across 20 websites is exhausting. FrontendEngineers.com does all the heavy lifting by aggregating 100+ sources in one screen. For less than $0.30 a day ($9/mo), get full Pro access to direct links and community referrals.',
    hookStyle: 'Time-saving empathy hook on reclaiming hours of job hunting every single week.'
  }
];

// Top-performing tech hashtags
const DEFAULT_HASHTAGS = [
  '#FrontendDeveloper',
  '#RemoteJobs',
  '#ReactJS',
  '#WebDevelopment',
  '#FrontendEngineers',
  '#JavaScript',
  '#TechJobs',
  '#WorkFromAnywhere'
];

const FALLBACK_HOOKS = [
  'Stop opening 30 tabs every day to find remote frontend jobs - FrontendEngineers.com puts them all in one place! 🛑💻🚀',
  'Ready to land a high-paying remote frontend job without jumping across 10 platforms? FrontendEngineers.com is your all-in-one hub! ⚡🌍🔥',
  'Searching for remote frontend jobs across dozens of boards? FrontendEngineers.com brings every top opportunity into one single feed! 🎯💎🚀',
  'Want all verified remote frontend jobs in one place for just $9/month? FrontendEngineers.com is built for developers like you! 💻🔥✨'
];

// ─── Gemini Prompt Builder ───────────────────────────────────

function buildPrompt(theme, isLong, randomSalt) {
  if (isLong) {
    return `You are an elite tech career growth expert, copywriter, and engineering founder who writes viral, high-converting LinkedIn posts that sell subscriptions to developers.

Write a HIGH-PERFORMING, ENGAGING, EMOJI-RICH, LONG-FORM LinkedIn post (strictly 1100 to 1450 characters) designed to SELL the $9/month Pro subscription for FrontendEngineers.com and convince developers that they NEVER need to visit another job board again.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
WINNING POST BLUEPRINT (FOLLOW EVERY STEP STRICTLY):

1. THE FIRST LINE (MANDATORY CATCHY HOOK):
- Must be a single scroll-stopping sentence or question containing both "FrontendEngineers.com" and "remote frontend jobs" (or "high-paying remote frontend jobs").
- Include multiple vibrant emojis (e.g., 🛑💻🚀, ⚡🌍🔥, or 🎯💎✨).
- Absolutely NO URLs or links in the first line or anywhere in the intro.
- Examples:
  "Stop opening 30 browser tabs every day searching for remote frontend jobs - FrontendEngineers.com brings them all into one place! 🛑💻🚀"
  "Why are you still checking 5 different job boards for remote frontend jobs? FrontendEngineers.com puts 1,000+ roles on one screen! ⚡🌍🔥"

2. THE DEVELOPER REALITY & THE ALL-IN-ONE SOLUTION (2-3 punchy sentences):
- Describe the exhausting reality of job hunting: spending hours juggling LinkedIn, Indeed, Wellfound, Twitter, and dozens of company career pages. 🤦‍♂️⏳
- Emphasize the core superpower: You NEVER need to go to another platform again. FrontendEngineers.com aggregates verified remote frontend roles from 100+ sources into one single high-speed dashboard, saving 10-15+ hours every week! 🌍⚡💻

3. TRANSITION LINE (WITH EMOJIS):
- Exactly: "Here is why ambitious developers use our all-in-one hub: 👇✨" or "Here is why smart developers stopped searching anywhere else: 👇🚀"

4. 3 TO 4 VALUE PILLARS (PACKED WITH EMOJIS & UPPERCASE HEADERS):
Each pillar must start with 1-2 eye-catching emojis, an UPPERCASE title, followed by a colon and a punchy description. Include these key angles:
- 🌍 ALL ROLES IN ONE PLACE: Aggregated from 100+ verified global sources into one clean feed. Say goodbye to tab overload and endless searching! 🛑💻
- ⚡ 100% FRONTEND FOCUS: Pure React, Next.js, TypeScript, Vue, and Angular positions. Zero backend noise and zero non-technical clutter! 🎯💎
- 🚀 DIRECT ATS & SKIP THE QUEUE: Bypass 500-applicant aggregator queues with direct Greenhouse, Lever, and Ashby application links! ⚡🏢
- 🤝 INSIDER REFERRALS: Connect directly with developers inside top remote tech companies to get your resume to hiring managers! 🔥👥

5. THE AGGRESSIVE $9 PRO SALES PITCH (MAKE IT AN IRRESISTIBLE NO-BRAINER):
- Dedicated, high-energy section selling the $9/month subscription hard! 💰💎
- Contrast the numbers: Why spend 3 to 6 months unemployed and stressed on broken free boards to save $9? 🤷‍♂️
- For just $9/month - literally $0.30 a day, less than half a cup of coffee - PRO unlocks 1,000+ remote jobs, direct ATS links, and insider employee referrals! 🔓🚀
- Landing just ONE remote frontend offer paying $100k-$180k+ pays for this subscription 10,000 times over! Cancel anytime with zero hassle. 📈💵

6. CALL TO ACTION & ACTION LINKS (PRESERVE EXACTLY THESE):
🔍 Explore active roles:
https://www.frontendengineers.com

⚡ Upgrade to PRO access here:
https://www.frontendengineers.com/pricing

7. HASHTAGS (8 TARGETED HASHTAGS AT THE VERY END):
#FrontendDeveloper #RemoteJobs #ReactJS #WebDevelopment #FrontendEngineers #JavaScript #TechJobs #WorkFromAnywhere

---
CRITICAL RULES FOR LINKEDIN API:
- EMOJIS: Use LOTS of engaging, modern emojis throughout the entire post (🔥, 🚀, 💻, ⚡, 🌍, 🎯, 💰, ✨, 🛑, 💎, ⏳, 🤝, 📈, 🔓, 💵) to make it thumb-stopping and visually captivating!
- LENGTH: Strictly 1100 to 1450 characters total - optimal for dwell time, mobile readability, and LinkedIn algorithm push.
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses. Use dashes - or commas instead. LinkedIn API truncates on parentheses.
- Generous paragraph spacing with blank lines between sections for effortless mobile scanning.
- Output the post strictly between these delimiters:
===POST_START===
[Full text of the LinkedIn post here]
===POST_END===`;
  }

  return `You are an elite tech career growth expert and copywriter.

Write a punchy, high-converting, EMOJI-RICH LinkedIn post (strictly 750 to 950 characters) designed to SELL the $9/month Pro subscription for FrontendEngineers.com and show developers why they NEVER need to visit another job board again.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt})

---
CRITICAL POST STRUCTURE:
1. THE FIRST LINE: Catchy hook containing "FrontendEngineers.com" and "remote frontend jobs" with vibrant emojis (e.g., 🛑💻🚀 or ⚡🌍🔥). NO URLs at top.
2. ALL-IN-ONE VALUE: Explain that developers do not need to check 10 different platforms anymore. We aggregate 100+ sources into one single feed.
3. VALUE PILLARS (WITH EMOJIS):
- 🌍 ALL ROLES IN ONE PLACE: 100+ sources aggregated into one clean screen. No more tab hopping! 💻✨
- ⚡ 100% FRONTEND FOCUS: Pure React, Next.js, and TypeScript roles with zero clutter! 🎯
- 🚀 DIRECT ATS & REFERRALS: Skip 500-applicant queues with direct Greenhouse/Lever links! 🔥
4. THE $9 SALES PITCH: For just $9/month - literally $0.30 a day - unlock 1,000+ verified remote jobs, direct links, and insider referrals. A $120k+ remote role pays this back 10,000x over! 💰💎
5. LINKS:
🔍 Explore active roles:
https://www.frontendengineers.com

⚡ Upgrade to PRO access here:
https://www.frontendengineers.com/pricing
6. HASHTAGS:
#FrontendDeveloper #RemoteJobs #ReactJS #WebDevelopment #FrontendEngineers #JavaScript #TechJobs #WorkFromAnywhere

---
CRITICAL RULES:
- EMOJIS: Use lots of vibrant emojis (🔥, 🚀, 💻, ⚡, 🌍, 🎯, 💰, ✨, 🛑, 💎, 🤝) throughout!
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses. Use dashes - or commas instead.
- Output the post strictly between these delimiters:
===POST_START===
[Full text of the LinkedIn post here]
===POST_END===`;
}

// ─── Gemini AI Generation ───────────────────────────────────

async function generatePostWithGemini() {
  const theme = CREATIVE_THEMES[Math.floor(Math.random() * CREATIVE_THEMES.length)];
  const randomSalt = Math.floor(Math.random() * 900000 + 100000);
  const prompt = buildPrompt(theme, IS_LONG, randomSalt);

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`   Trying model: ${model} (attempt ${attempt}/2, angle: "${theme.name}")...`);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.85,
                topP: 0.95,
                maxOutputTokens: 8192,
                thinkingConfig: {
                  thinkingBudget: 512,
                },
              },
            }),
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`   ⚠️ Gemini ${model} HTTP ${res.status}: ${errText.substring(0, 150)}`);
          if ((res.status === 429 || res.status === 503) && attempt < 2) {
            await new Promise(r => setTimeout(r, 6000));
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

        // Extract post using delimiters with safe fallback
        let post = text.trim();
        if (post.includes('===POST_START===')) {
          post = post.split('===POST_START===')[1];
          if (post.includes('===POST_END===')) {
            post = post.split('===POST_END===')[0];
          }
        }
        post = post.replace(/===+POST_START===+/gi, '').replace(/===+POST_END===+/gi, '').trim();

        if (post.length < 150) {
          console.warn(`   ⚠️ Generated post too short (${post.length} chars). Retrying...`);
          continue;
        }

        // Guarantee strictly the proper link and hook format
        post = enforceAllowedLinks(post);

        return post;
      } catch (err) {
        console.warn(`   ⚠️ Exception calling Gemini model ${model}: ${err.message}`);
      }
    }
  }

  throw new Error('Failed to generate post after exhausting available Gemini models');
}

// ─── Enforcement & Sanitization Helpers ──────────────────────

function enforceAllowedLinks(text) {
  let cleaned = text;

  // 1. Remove all raw URLs
  cleaned = cleaned.replace(/https?:\/\/(www\.)?frontendengineers\.com[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/[^\s\n]*/gi, '');

  // 2. Remove any variations of link CTA header lines preceding URLs to prevent duplicate headers
  cleaned = cleaned.replace(/^(🔍|👉|⚡|🚀|🔗|\*|-)?\s*(browse active roles|explore current job listings|explore open listings today|explore open listings|explore active frontend roles|explore active roles|explore remote frontend jobs|get pro access here|upgrade to pro access here|upgrade to pro access|get pro access for just \$9\/month):?\s*$/gim, '');

  // 3. Separate hashtags from post content
  const rawLines = cleaned.split('\n');
  const nonHashLines = [];
  const hashTags = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#')) {
      const tags = trimmed.match(/#[a-zA-Z0-9_]+/g);
      if (tags) hashTags.push(...tags);
    } else {
      const lower = trimmed.toLowerCase();
      // Skip leftover URL fragments or standalone link lines
      if (lower === 'frontendengineers.com' || lower === 'frontendengineers.com/pricing' || lower.includes('https://') || lower.includes('http://')) {
        continue;
      }
      nonHashLines.push(trimmed);
    }
  }

  // 4. Ensure the first line contains both "FrontendEngineers.com" and frontend job reference
  if (nonHashLines.length > 0) {
    const firstLine = nonHashLines[0];
    const hasFE = /frontendengineers\.com/i.test(firstLine);
    const hasJob = /(remote\s+)?frontend\s+(job|engineer|dev|role)s?/i.test(firstLine);

    if (!hasFE || !hasJob) {
      nonHashLines[0] = FALLBACK_HOOKS[Math.floor(Math.random() * FALLBACK_HOOKS.length)];
    }
  } else {
    nonHashLines.push(FALLBACK_HOOKS[Math.floor(Math.random() * FALLBACK_HOOKS.length)]);
  }

  // 5. Group body lines with clean spacing
  let bodyText = '';
  for (let i = 0; i < nonHashLines.length; i++) {
    const curr = nonHashLines[i];
    if (i === 0) {
      bodyText += curr;
    } else {
      bodyText += '\n\n' + curr;
    }
  }

  // 6. Action links block formatted with high-converting emojis
  const linksBlock = `🔍 Explore active roles:\nhttps://www.frontendengineers.com\n\n⚡ Upgrade to PRO access here:\nhttps://www.frontendengineers.com/pricing`;

  // 7. Combine extracted hashtags with top-performing defaults, keeping 8 unique tags
  const combinedTags = [...hashTags, ...DEFAULT_HASHTAGS];
  const uniqueTags = Array.from(new Set(combinedTags.map(t => t.trim()))).filter(Boolean).slice(0, 8);
  const tagString = uniqueTags.join(' ');

  // Construct final post: Catchy hook & body -> Action links -> 8 High-performing hashtags
  return `${bodyText}\n\n${linksBlock}\n\n${tagString}`.trim();
}

function sanitizeForLinkedIn(text) {
  // Replace Markdown links: [text](url) -> text - url
  let safeText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 - $2');
  // Strip characters LinkedIn API rejects or truncates on:
  // * _ ~ < > ` [ ] ( )
  safeText = safeText.replace(/[*_~<>`[\]()]/g, '');
  safeText = safeText.replace(/\r/g, '');
  return safeText.trim();
}

async function postToLinkedIn(text, authorUrn, accessToken) {
  const safeText = sanitizeForLinkedIn(text);

  const payload = {
    author: authorUrn,
    commentary: safeText,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202608',
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 201 || res.status === 200) {
    const postId = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || 'unknown';
    return { success: true, postId };
  }

  const errBody = await res.text();
  throw new Error(`LinkedIn API error: ${res.status} ${errBody}`);
}

// ─── Main Execution ──────────────────────────────────────────

async function runSinglePostingCycle() {
  console.log('\n🚀 Starting LinkedIn Post Cycle...');
  console.log(`⏰ Current Timestamp: ${new Date().toISOString()}`);
  console.log('═'.repeat(65));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE - will not publish to LinkedIn\n');
  if (IS_LONG) {
    console.log('📝 Long-form mode active (1,100-1,500 characters, high-engagement layout)\n');
  } else {
    console.log('📝 Compact mode active (700-950 characters)\n');
  }

  // 1. Generate single post with Gemini AI
  console.log('🤖 Generating LinkedIn post with Gemini AI...');
  const post = await generatePostWithGemini();

  console.log('\n📄 Generated LinkedIn Post:');
  console.log('─'.repeat(65));
  console.log(sanitizeForLinkedIn(post));
  console.log('─'.repeat(65));
  console.log(`Length: ${post.length} chars`);

  if (DRY_RUN) {
    console.log('\n✅ LinkedIn DRY RUN complete. Post successfully generated!');
    return;
  }

  // 2. Discover all configured LinkedIn accounts
  const accounts = [];

  // Primary Account
  if (LINKEDIN_ACCESS_TOKEN && (LINKEDIN_PERSON_ID || LINKEDIN_ORG_ID)) {
    accounts.push({
      token: LINKEDIN_ACCESS_TOKEN,
      personId: LINKEDIN_PERSON_ID,
      orgId: LINKEDIN_ORG_ID,
      name: 'Primary Account'
    });
  }

  // Additional Accounts (e.g., LINKEDIN_ACCESS_TOKEN_2, _3, etc.)
  let idx = 2;
  while (process.env[`LINKEDIN_ACCESS_TOKEN_${idx}`]) {
    const pId = process.env[`LINKEDIN_PERSON_ID_${idx}`];
    const oId = process.env[`LINKEDIN_ORG_ID_${idx}`];
    if (pId || oId) {
      accounts.push({
        token: process.env[`LINKEDIN_ACCESS_TOKEN_${idx}`],
        personId: pId,
        orgId: oId,
        name: `Account ${idx}`
      });
    }
    idx++;
  }

  if (accounts.length === 0) {
    console.error('❌ Missing LINKEDIN_ACCESS_TOKEN or (LINKEDIN_PERSON_ID / LINKEDIN_ORG_ID) in environment variables.');
    process.exit(1);
  }

  console.log(`\n📤 Publishing post to ${accounts.length} LinkedIn account(s)...`);

  let totalPublished = 0;

  for (const acc of accounts) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`➡️  Target Account: ${acc.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Target URNs for this account
    const targets = [];
    if (acc.personId) targets.push({ type: 'Personal Profile', urn: `urn:li:person:${acc.personId}` });
    if (acc.orgId) targets.push({ type: 'Company Page', urn: `urn:li:organization:${acc.orgId}` });

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (i > 0) {
        console.log('   ⏳ Waiting 10s before publishing to next target...');
        await new Promise(r => setTimeout(r, 10000));
      }

      try {
        console.log(`\n   Posting to ${target.type} (${target.urn})...`);
        const res = await postToLinkedIn(post, target.urn, acc.token);
        console.log(`   ✅ Successfully posted! Post ID: ${res.postId}`);
        totalPublished++;
      } catch (err) {
        if (err.message.includes('AUTHENTICATION_FAILED') || err.message.includes('RESTRICTED_MEMBER') || err.message.includes('401')) {
          console.warn(`   ⚠️ Authentication failed for ${acc.name} (${target.type}): Account token is expired or restricted.`);
          console.warn(`   💡 Run 'npm run linkedin:auth' to re-authenticate this account.`);
        } else {
          console.error(`   ❌ Failed to post to ${target.type}: ${err.message}`);
        }
      }
    }
  }

  if (totalPublished > 0) {
    console.log(`\n🎉 Successfully published post to LinkedIn (${totalPublished} destination(s))!`);
  } else {
    console.error('\n❌ No posts were published successfully.');
    if (!LOOP_INTERVAL_MINUTES) {
      process.exit(1);
    }
  }

  console.log('\n✅ LinkedIn posting complete!');
}

async function main() {
  if (LOOP_INTERVAL_MINUTES) {
    console.log(`🔁 Hourly continuous loop mode enabled: running every ${LOOP_INTERVAL_MINUTES} minutes.`);
    while (true) {
      try {
        await runSinglePostingCycle();
      } catch (err) {
        console.error('❌ Cycle encountered an error:', err.message || err);
      }
      const nextTime = new Date(Date.now() + LOOP_INTERVAL_MINUTES * 60 * 1000).toLocaleTimeString();
      console.log(`\n⏳ Next hourly cycle will run in ${LOOP_INTERVAL_MINUTES} minutes (at ${nextTime}). Sleeping...`);
      await new Promise(r => setTimeout(r, LOOP_INTERVAL_MINUTES * 60 * 1000));
    }
  } else {
    await runSinglePostingCycle();
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
