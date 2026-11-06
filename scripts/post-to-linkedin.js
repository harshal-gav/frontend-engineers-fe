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

// High-performing creative themes engineered from viral LinkedIn career posts
const CREATIVE_THEMES = [
  {
    name: 'Frontend Only vs Generic Job Board Clutter',
    angle: 'Generic job sites swallow applications into a black hole and force developers to scroll through thousands of irrelevant backend roles. FrontendEngineers.com is built 100% exclusively for frontend developers with pure React, Next.js, Vue, and CSS roles.',
    hookStyle: 'Punchy question hook or bold statement focused on finding high-paying remote frontend jobs with FrontendEngineers.com.'
  },
  {
    name: 'All Worldwide Remote Jobs in One Place',
    angle: 'Stop jumping across 50 different browser tabs and obscure job boards. FrontendEngineers.com brings every verified remote frontend role from top global companies into a single curated platform.',
    hookStyle: 'Inspiring, high-energy hook on global remote frontend opportunities.'
  },
  {
    name: 'Safe, Verified & Zero Ghost Postings',
    angle: 'Modern job hunting is plagued by ghost jobs, recruiter spam, and dead links. Every single job on FrontendEngineers.com is vetted and verified by our team so developers never waste hours on fake postings.',
    hookStyle: 'Empathy-driven reality check on wasted applications vs verified active roles.'
  },
  {
    name: 'Skip the 500-Applicant ATS Queue',
    angle: 'Aggregator job boards put you behind 600+ candidates who applied days earlier. For $9/month ($0.30/day), Pro gives you direct 1-click ATS application links on Greenhouse, Lever, and Ashby plus insider referrals.',
    hookStyle: 'Tactical speed advantage on landing a remote frontend job fast.'
  },
  {
    name: 'The $9 Career Investment vs Months of Frustration',
    angle: 'A remote frontend role pays $120k-$200k+. Why spend 6 months unemployed and stressed on broken free boards to save $9? For $0.30/day, unlock 1,000+ verified remote jobs and land interviews weeks faster.',
    hookStyle: 'Mathematical ROI reality check for ambitious frontend developers.'
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
  'Searching for high-paying remote frontend jobs? FrontendEngineers.com is built exclusively for devs like you! 🚀',
  'Finding high-paying remote frontend jobs is easier than ever with FrontendEngineers.com! 💻✨',
  'Tired of searching endlessly for remote frontend jobs? FrontendEngineers.com brings every top opportunity straight to your screen! ⚡',
  'Landing a high-paying remote frontend job shouldn\'t take months of silence - FrontendEngineers.com gives you the direct edge. 🎯'
];

// ─── Gemini Prompt Builder ───────────────────────────────────

function buildPrompt(theme, isLong, randomSalt) {
  if (isLong) {
    return `You are an elite tech career advisor and engineering founder who writes viral, high-converting LinkedIn posts for frontend developers.

Write a HIGH-PERFORMING, ENGAGING, LONG-FORM LinkedIn post (strictly 1100 to 1500 characters) that follows the proven winning formula of viral tech job posts for FrontendEngineers.com.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
PROVEN WINNING POST STRUCTURE (FOLLOW THIS EXACT BLUEPRINT):

1. THE FIRST LINE (MANDATORY CATCHY HOOK):
- Must be a single scroll-stopping question or punchy sentence featuring both "FrontendEngineers.com" and "remote frontend jobs" (or "high-paying remote frontend jobs").
- End with a relevant emoji (e.g., 🚀, 💻✨, or ⚡).
- Examples of winning hooks:
  "Searching for high-paying remote frontend jobs? FrontendEngineers.com is built exclusively for devs like you! 🚀"
  "Finding high-paying remote frontend jobs is easier than ever with FrontendEngineers.com! 💻✨"
  "Tired of searching endlessly for remote frontend jobs? FrontendEngineers.com brings every top opportunity straight to your screen! ⚡"
- Absolutely NO URLs or links in the first line or at the top of the post.

2. THE DEVELOPER PAIN POINT & EMPATHY (2-3 SENTENCES):
- Speak directly to the developer's frustration with generic job boards:
  - Applications disappearing into a void without a response.
  - Sifting through hundreds of irrelevant backend and full-stack roles.
  - Expired ghost listings and 500-applicant queues.
- Explain how FrontendEngineers.com solves this by streamlining the search exclusively for frontend developers so they can get hired fast.

3. THE TRANSITION LINE:
- Exactly: "Here is why developers love us:" or "Here is why developers trust us:"

4. THE 3 TO 4 VALUE PILLARS (WITH EMOJIS & UPPERCASE HEADERS):
Each pillar must start with an eye-catching emoji, a concise UPPERCASE title, followed by a colon and a punchy 1-2 sentence description. Include 3 or 4 of these:
- ⚡ MASSIVE ACCESS FOR FRONTEND JOBS ONLY: Skip the clutter and focus 100% on UI, React, Next.js, Vue, TypeScript, and CSS roles. No backend noise.
- 🌍 GO GLOBAL: Find worldwide remote frontend jobs from top global companies in one place without jumping across dozens of tabs.
- 🛡️ SAFE, ACCURATE & NO GHOST POSTS: Every single job is vetted and verified before going live so you never waste time on dead links, recruiter spam, or fake postings.
- 🎯 DIRECT ATS & EMPLOYEE REFERRALS: Skip 500-applicant aggregator queues. Apply directly on company ATS portals (Greenhouse, Lever, Ashby) and get insider employee referrals.

5. THE NO-BRAINER OFFER & PRICING:
- "Ready to land your next big role? Upgrading your career shouldn't cost a fortune. You can unlock 1,000+ remote jobs with PRO access for just $9/month!"
- Mention that landing one $120k-$200k+ role pays for this thousands of times over - literally $0.30 a day, cancel anytime.

6. THE ACTION LINKS (KEEP EXACTLY THESE TWO IN THE BODY):
🔍 Explore active roles:
https://www.frontendengineers.com

⚡ Upgrade to PRO access here:
https://www.frontendengineers.com/pricing

7. HASHTAGS (8 HIGH-PERFORMING TECH HASHTAGS):
Include exactly 8 targeted, high-performing hashtags at the very bottom:
#FrontendDeveloper #RemoteJobs #ReactJS #WebDevelopment #FrontendEngineers #JavaScript #TechJobs #WorkFromAnywhere

---
CRITICAL RULES FOR LINKEDIN API:
- LENGTH: Strictly 1100 to 1500 characters - optimal for dwell time, reader engagement, and readability.
- NO LINK AT THE TOP: Do NOT put any link at the top. The post must start with the catchy sentence.
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses. Use dashes - or commas instead. LinkedIn API truncates on parentheses.
- Generous paragraph spacing for mobile readability.
- Output the post strictly between these delimiters:
===POST_START===
[Full text of the LinkedIn post here]
===POST_END===`;
  }

  return `You are a high-converting tech career advisor and engineering founder.

Write a punchy, high-converting LinkedIn post (strictly 700 to 950 characters) about FrontendEngineers.com.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt})

---
CRITICAL POST STRUCTURE:
1. THE FIRST LINE: Catchy hook containing "FrontendEngineers.com" and "remote frontend jobs" with an emoji. NO URLs at top.
2. PAIN POINT & VALUE: Explain how generic boards waste dev time, and how FrontendEngineers.com provides verified, frontend-only roles.
3. VALUE PILLARS (WITH EMOJIS):
- ⚡ MASSIVE ACCESS FOR FRONTEND ONLY: Pure React, Vue, TypeScript, CSS roles.
- 🌍 GLOBAL OPPORTUNITIES: Remote frontend jobs worldwide in one place.
- 🛡️ SAFE & VERIFIED: No ghost jobs, zero spam.
4. OFFER & PRICE: Unlock 1,000+ remote jobs with PRO access for just $9/month ($0.30/day).
5. LINKS:
🔍 Explore active roles:
https://www.frontendengineers.com

⚡ Upgrade to PRO access here:
https://www.frontendengineers.com/pricing
6. HASHTAGS:
#FrontendDeveloper #RemoteJobs #ReactJS #WebDevelopment #FrontendEngineers #JavaScript #TechJobs #WorkFromAnywhere

---
CRITICAL RULES:
- NO MARKDOWN: NO **bold**, NO *italics*, NO backticks.
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
