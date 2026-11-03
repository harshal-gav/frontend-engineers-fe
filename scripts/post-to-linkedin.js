#!/usr/bin/env node
/**
 * Automated LinkedIn Poster (Remote Frontend Jobs, Community Referrals & Employer Hiring)
 * 
 * Generates a SINGLE high-converting LinkedIn post with:
 *   - MANDATORY OPENING: The very first sentence MUST mention "Remote Frontend Developer jobs" and "FrontendEngineers.com".
 *   - FRESHNESS & VARIETY: Dynamically cycles creative angles and themes so every post is distinct and unique.
 *   - PRIMARY FOCUS (80%+): Verified Remote Frontend Developer Jobs (React, Next.js, Vue, TypeScript)
 *   - MINIMAL FOCUS (10%): Direct Community Employee Referrals
 *   - MINIMAL FOCUS (10%): Employer Hiring ($99/mo Unlimited Plan)
 *   - EXACT 2 LINKS ONLY:
 *       👉 Explore remote frontend jobs:
 *       https://www.frontendengineers.com
 *       👉 Get pro access for just $9/month:
 *       https://www.frontendengineers.com/pricing
 * 
 * Then publishes the single post to all configured LinkedIn accounts (Personal Profile and/or Company Page).
 * Runs on a schedule every hour via GitHub Actions.
 * 
 * Environment variables required:
 *   GEMINI_API_KEY          - Google Gemini API key
 *   LINKEDIN_ACCESS_TOKEN   - LinkedIn OAuth2 access token
 *   LINKEDIN_PERSON_ID      - LinkedIn Person URN ID (optional)
 *   LINKEDIN_ORG_ID         - LinkedIn Organization URN ID (optional)
 * 
 * Flags:
 *   --dry-run    - Generate the post but don't publish to LinkedIn
 * 
 * Usage:
 *   node scripts/post-to-linkedin.js
 *   node scripts/post-to-linkedin.js --dry-run
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

// High-engagement creative themes engineered for LinkedIn algorithm & maximum $9 Pro conversions
const CREATIVE_THEMES = [
  {
    name: 'The $9 Cheat Code vs 6 Months of Ghosting',
    angle: 'Frontend developers waste 20 hours a week sending hundreds of applications to stale ghost jobs on free aggregators, competing with 800 applicants. Investing $9/month - literally $0.30 a day - gives you direct 1-click ATS application links and employee referrals so you skip the queue completely.',
    hookStyle: 'Bold, contrarian, and hard-hitting reality check.'
  },
  {
    name: 'The Insane Math of a $140k Remote Frontend Offer',
    angle: 'A remote frontend role pays $10,000 to $16,000 every single month. Why do developers hesitate on a $9/month investment that gives them direct employer links and insider referrals? If it helps you land even 1 week faster, the ROI is over 1,000x.',
    hookStyle: 'Analytical, high-conviction mathematical breakdown of job search ROI.'
  },
  {
    name: 'Why Free Job Boards Keep You Stuck in the ATS Black Hole',
    angle: 'Free job boards monetize your eyeballs with expired listings and 1,000-applicant queues. FrontendEngineers.com Pro cuts through the noise: 850+ vetted remote roles, direct ATS links, verified salaries, and community referrals for just $9/month. Cancel anytime.',
    hookStyle: 'Eye-opening exposé on broken job board incentives vs Pro leverage.'
  },
  {
    name: 'The 48-Hour Remote Job Rule - Speed Wins Interviews',
    angle: '90% of remote frontend interview callbacks go to candidates who apply in the first 24 to 48 hours directly on Greenhouse, Lever, or Ashby. Pro alerts and direct links get you in the first 10 applicants instead of applicant #500 for just $9/mo.',
    hookStyle: 'Tactical, urgent, and competitive advantage.'
  },
  {
    name: 'Stop Treating Your Remote Job Search Like A Free Lottery',
    angle: 'Sending 500 blind applications on generic boards is gambling. Strategic applying with direct employer ATS links and insider referrals is leverage. FrontendEngineers.com Pro gives you the unfair advantage for $9/mo. Why stay unemployed for months to save 30 cents a day?',
    hookStyle: 'Empowering, assertive, and high-conviction push to invest in career speed.'
  }
];

// ─── Gemini AI Generation (Optimized for LinkedIn Reach & Conversions) ──

async function generatePostWithGemini() {
  const theme = CREATIVE_THEMES[Math.floor(Math.random() * CREATIVE_THEMES.length)];
  const randomSalt = Math.floor(Math.random() * 900000 + 100000);

  const prompt = `You are an elite tech career strategist and engineering founder who writes high-converting LinkedIn posts that convince software engineers to take immediate action.

Write an authentic, highly readable, punchy LinkedIn post that AGGRESSIVELY promotes FrontendEngineers.com Pro ($9/month) as the ultimate unfair advantage to land a high-paying remote frontend developer job.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
CRITICAL POST STRUCTURE & CONVERSION FORMULA:

1. THE SCROLL-STOPPING HOOK - FIRST 2 LINES:
- Open with a raw, shocking, or contrarian truth about how broken the remote frontend job market is - ghost jobs, 800-applicant queues, why talented engineers get zero interviews.
- Must force the developer to tap "...see more" within 2 seconds.
- DO NOT start with boring ads like "Are you looking for a job?". Start with the brutal reality of the market.

2. THE AGITATION - WHY FREE METHODS ARE A TRAP:
- Expose why mass-applying on free aggregator job boards wastes months of life:
  - 40%+ of listings are expired ghost jobs.
  - Aggregator forms mangle your resume parsing.
  - You are applicant #600 competing with thousands of spam resumes.

3. THE UNFAIR ADVANTAGE - INTRODUCE FRONTENDENGINEERS.COM PRO:
- Position FrontendEngineers.com Pro as the obvious, high-leverage cheat code for serious frontend developers.
- Explicitly sell the core features:
  - Direct 1-click ATS application links - Greenhouse, Lever, Ashby, Workday - bypass aggregators and land straight in the hiring manager's portal.
  - Insider employee referrals - bypass the automated ATS resume black hole entirely.
  - Verified salaries - $120k to $200k+ - zero lowball surprises.
  - Real-time instant job alerts - apply in the first 30 minutes before the crowd arrives.

4. THE AGGRESSIVE $9 VALUE PITCH & ROI ANCHOR:
- Explicitly state the price: Just $9/month - literally $0.30 a day, less than a cup of coffee per week.
- Emphasize the insane ROI: A single remote frontend job offer pays $120,000+ - over $10,000 every month. Spending $9 to skip the queue and land interviews weeks faster is a 1,000x return. Why spend 6 months unpaid to save $9?
- Mention that members can cancel anytime with 1 click.

5. HARD-HITTING CALL TO ACTION:
- Give a direct, punchy push to take action:
  Stop playing the lottery with free aggregators. Unlock direct ATS links and referrals for $9/mo at FrontendEngineers.com

6. HASHTAGS:
- Include EXACTLY 3 to 5 targeted, high-traffic hashtags at the very bottom:
#FrontendDeveloper #ReactJS #WebDevelopment #RemoteWork #TechJobs

---
CRITICAL RULES FOR LINKEDIN API:
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks. LinkedIn API displays raw markdown characters as ugly plaintext.
- NO PARENTHESES: DO NOT use parentheses '(' or ')' anywhere in the post. LinkedIn API silently truncates posts at '('. Use dashes - or commas instead.
- LENGTH: 1100 to 1500 characters - optimal for mobile reading dwell time and conversion.
- Output the post strictly between these delimiters:
===POST_START===
[Full text of the LinkedIn post here]
===POST_END===`;

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

        // Extract post using delimiters
        const postMatch = text.match(/===POST_START===([\s\S]*?)===POST_END===/);
        let post = postMatch ? postMatch[1].trim() : text.trim();

        // Strip any residual delimiters if present
        post = post.replace(/===+POST_START===+/gi, '').replace(/===+POST_END===+/gi, '').trim();

        if (post.length < 300) {
          console.warn(`   ⚠️ Generated post too short (${post.length} chars). Retrying...`);
          continue;
        }

        // Guarantee strictly only the website link is kept and properly formatted
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

  // 1. Remove any full URLs like https:// or http:// or www.
  cleaned = cleaned.replace(/https?:\/\/(www\.)?frontendengineers\.com[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/www\.frontendengineers\.com/gi, 'FrontendEngineers.com');

  // 2. Normalize excess spacing
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // ONLY this: "FrontendEngineers.com" directly on top of the post
  const topLinkBlock = `FrontendEngineers.com`;

  // 3. Separate hashtags from post content
  const lines = cleaned.split('\n');
  const nonHashLines = [];
  const hashTags = [];

  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      const tags = line.trim().match(/#[a-zA-Z0-9_]+/g);
      if (tags) hashTags.push(...tags);
    } else {
      // Skip if this line is just FrontendEngineers.com to avoid duplicating the top line
      if (line.trim().toLowerCase() === 'frontendengineers.com' || line.trim().toLowerCase() === '👉 frontendengineers.com') {
        continue;
      }
      nonHashLines.push(line);
    }
  }

  const uniqueTags = Array.from(new Set(hashTags)).slice(0, 5);
  const tagString = uniqueTags.length > 0
    ? uniqueTags.join(' ')
    : '#FrontendDeveloper #ReactJS #WebDevelopment #RemoteWork #TechJobs';

  // Return with ONLY "FrontendEngineers.com" placed on TOP of the post
  return `${topLinkBlock}\n\n${nonHashLines.join('\n').trim()}\n\n${tagString}`.trim();
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

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('🚀 LinkedIn Auto-Poster (Remote Frontend Jobs, Referrals & Employer Hiring)');
  console.log('═'.repeat(65));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE - will not publish to LinkedIn\n');

  // 1. Generate single post with Gemini AI
  console.log('\n🤖 Generating LinkedIn post with Gemini AI...');
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
          console.error(`   ❌ Authentication failed for ${acc.name} (${target.type}). Token is expired or invalid.`);
          console.error(`   💡 Your 60-day LinkedIn OAuth token has expired. Run 'npm run linkedin:auth' to refresh it.`);
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
    process.exit(1);
  }

  console.log('\n✅ LinkedIn posting complete!');
  console.log('\n✅ All tasks done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
