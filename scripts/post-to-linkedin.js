#!/usr/bin/env node
/**
 * Automated LinkedIn Poster (Remote Frontend Jobs, Community Referrals & Employer Hiring)
 * 
 * Generates a high-converting LinkedIn post with:
 *   - MANDATORY FIRST LINE: Catchy hook containing "FrontendEngineers.com" and "Remote Frontend Job"
 *   - NO LINK AT THE TOP
 *   - VALUE STACK: Direct ATS links, employee referrals, verified salaries, instant alerts ($9/mo)
 *   - EXACT 2 IN-BETWEEN LINKS:
 *       👉 Explore remote frontend jobs:
 *       https://www.frontendengineers.com
 *       👉 Get pro access for just $9/month:
 *       https://www.frontendengineers.com/pricing
 * 
 * Flags:
 *   --dry-run    - Generate the post but don't publish to LinkedIn
 *   --long       - Generate an expanded, story-driven post (1200-1600 chars)
 * 
 * Usage:
 *   node scripts/post-to-linkedin.js --dry-run
 *   node scripts/post-to-linkedin.js --long --dry-run
 *   node scripts/post-to-linkedin.js
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
const IS_LONG = process.argv.includes('--long');

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

// High-engagement creative themes engineered for short, punchy $9 Pro conversions
const CREATIVE_THEMES = [
  {
    name: 'Skip the 500-Applicant ATS Queue',
    angle: 'Stop applying to stale ghost jobs through free aggregators. For $9/month, Pro gives you direct 1-click ATS application links and employee referrals so your resume actually reaches hiring teams.',
    hookStyle: 'Catchy, direct, and focused on landing a Remote Frontend Job with FrontendEngineers.com.'
  },
  {
    name: 'The $9 Career Investment vs Months of Ghosting',
    angle: 'A remote frontend role pays $120k-$200k+. Why spend 6 months unemployed applying on broken free boards to save $9? FrontendEngineers.com Pro gives you the unfair advantage.',
    hookStyle: 'Punchy mathematical reality check on landing a Remote Frontend Job.'
  },
  {
    name: 'Why Aggregators Are A Trap For Frontend Devs',
    angle: 'Free job boards feed you expired listings and 800-applicant queues. Pro gives you 100% verified remote roles, direct ATS links, and referrals for just $9/month ($0.30/day).',
    hookStyle: 'Exposing the broken system vs FrontendEngineers.com.'
  },
  {
    name: 'Apply In The First 30 Minutes',
    angle: '90% of remote frontend callbacks go to the first 50 applicants on the company ATS. Pro alerts and direct links put you in the first 10 for $9/month.',
    hookStyle: 'Tactical, urgent speed advantage for a Remote Frontend Job.'
  }
];

// ─── Gemini Prompt Builder ───────────────────────────────────

function buildPrompt(theme, isLong, randomSalt) {
  if (isLong) {
    return `You are an elite tech career advisor and engineering founder who writes viral, high-converting LinkedIn posts.

Write a HIGH-CONVERTING, STORY-DRIVEN LONG-FORM LinkedIn post (strictly 1200 to 1600 characters - well within LinkedIn 3000 limit) that exposes the brutal reality of the tech hiring market and aggressively converts readers to buy the FrontendEngineers.com Pro $9/month membership.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
CRITICAL POST STRUCTURE & CONVERSION RULES:

1. THE FIRST LINE (MANDATORY CATCHY HOOK):
- The VERY FIRST LINE must be a catchy, scroll-stopping sentence that MUST explicitly include both "FrontendEngineers.com" and "Remote Frontend Job" (for example: "Landing a high-paying Remote Frontend Job shouldn't take 6 months of being ghosted - FrontendEngineers.com was built to fix that.").
- Absolutely NO URLs or links in the first line or at the top of the post.

2. THE AGITATION & REALITY CHECK (WHY FREE JOB SEARCH IS BROKEN):
- Break down why skilled React, Next.js, and TypeScript developers get zero callbacks right now:
  - 40%+ of listings on free aggregators are expired ghost jobs kept up for ad impressions.
  - Middleman aggregator forms mangle resume parsing before a recruiter ever sees it.
  - Applying days late means competing with 600+ spam applicants. Recruiters stop after applicant #50.

3. WHAT WE SELL FOR $9/MONTH (THE PRO LEVERAGE):
For $9/month - literally $0.30 a day - FrontendEngineers.com Pro gives you:
- Direct 1-click ATS application links: Greenhouse, Lever, Ashby, Workday. Apply straight to the employer, zero middleman loops.
- Insider employee referrals: Hand-deliver your resume to bypass automated ATS filters.
- 850+ vetted remote roles: Verified salaries from $120k to $200k+. Zero ghost jobs, zero lowballs.
- Real-time instant alerts: Apply in the first 30 minutes before the crowd arrives.

4. THE ECONOMIC NO-BRAINER (ROI MATH):
A remote frontend developer salary is $10,000 to $16,000 every single month ($120k to $200k per year).
Spending $9/month - $0.30 a day - to land interviews weeks or months faster is a 1,000x return.
Why spend 6 months unemployed and stressed just to save $9? Cancel anytime with 1 click.

5. IN-BETWEEN LINKS (KEEP EXACTLY THESE TWO IN THE BODY):
👉 Explore remote frontend jobs:
https://www.frontendengineers.com

👉 Get pro access for just $9/month:
https://www.frontendengineers.com/pricing

6. HASHTAGS:
Include 3 to 4 targeted hashtags at the very bottom:
#FrontendDeveloper #ReactJS #RemoteWork #TechJobs

---
CRITICAL RULES FOR LINKEDIN API:
- LENGTH: Strictly 1200 to 1600 characters - optimal for dwell time without exceeding limits.
- NO LINK AT THE TOP: Do NOT put any link at the top. The post must start with the catchy sentence.
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses. Use dashes - or commas instead. LinkedIn API truncates on parentheses.
- Output the post strictly between these delimiters:
===POST_START===
[Full text of the LinkedIn post here]
===POST_END===`;
  }

  return `You are a high-converting tech career advisor and engineering founder.

Write an ULTRA-SHORT, punchy, high-converting LinkedIn post (strictly 600 to 850 characters) that gets straight to the point about what FrontendEngineers.com Pro sells for $9/month.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
CRITICAL POST STRUCTURE & CONVERSION RULES:

1. THE FIRST LINE (MANDATORY CATCHY HOOK):
- The VERY FIRST LINE must be a catchy, scroll-stopping sentence that MUST explicitly include both "FrontendEngineers.com" and "Remote Frontend Job" (for example: "Landing a high-paying Remote Frontend Job shouldn't take 6 months of ghosting - FrontendEngineers.com gives you the direct edge.").
- Absolutely NO URLs or links in the first line or at the top of the post.

2. WHAT WE SELL FOR $9/MONTH (CLEAR, DIRECT BULLETS):
For $9/month - literally $0.30 a day - FrontendEngineers.com Pro gives you:
- Direct 1-click ATS links: Apply directly on Greenhouse, Lever, Ashby - skip aggregators.
- Employee referrals: Get internal referrals to bypass the ATS filter entirely.
- 850+ vetted remote roles: Verified salaries from $120k to $200k+.
- Real-time instant alerts: Apply in the first 30 minutes before hundreds flood the role.

3. PRICE & ROI (1 SHORT SENTENCE):
Just $9/month - $0.30 a day, cancel anytime. Landing one $120k+ role pays for this thousands of times over.

4. IN-BETWEEN LINKS (KEEP EXACTLY THESE TWO IN THE BODY):
👉 Explore remote frontend jobs:
https://www.frontendengineers.com

👉 Get pro access for just $9/month:
https://www.frontendengineers.com/pricing

5. HASHTAGS:
Include 3 to 4 targeted hashtags at the very bottom:
#FrontendDeveloper #ReactJS #RemoteWork #TechJobs

---
CRITICAL RULES FOR LINKEDIN API:
- SHORT & PUNCHY: Strictly 600 to 850 characters. Keep it brief, crisp, and to the point.
- NO LINK AT THE TOP: Do NOT put any link at the top. The post must start with the catchy sentence.
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses. Use dashes - or commas instead. LinkedIn API truncates on parentheses.
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

  // 1. Remove all raw URLs and existing link CTA lines to guarantee deterministic formatting
  cleaned = cleaned.replace(/https?:\/\/(www\.)?frontendengineers\.com[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/👉\s*Explore remote frontend jobs:?/gi, '');
  cleaned = cleaned.replace(/👉\s*Get pro access[^\n]*/gi, '');

  // 2. Separate hashtags from post content
  const rawLines = cleaned.split('\n');
  const nonHashLines = [];
  const hashTags = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const tags = trimmed.match(/#[a-zA-Z0-9_]+/g);
      if (tags) hashTags.push(...tags);
    } else if (trimmed) {
      if (trimmed.toLowerCase().includes('frontendengineers.com/pricing') || trimmed.toLowerCase() === 'frontendengineers.com') {
        continue;
      }
      nonHashLines.push(trimmed);
    }
  }

  // 3. Ensure the first line contains both "FrontendEngineers.com" and "Remote Frontend Job"
  if (nonHashLines.length > 0) {
    const firstLine = nonHashLines[0];
    const hasFE = /frontendengineers\.com/i.test(firstLine);
    const hasJob = /remote frontend job/i.test(firstLine);

    if (!hasFE || !hasJob) {
      nonHashLines[0] = `Landing a high-paying Remote Frontend Job shouldn't take months of being ghosted - FrontendEngineers.com gives you the direct edge.`;
    }
  } else {
    nonHashLines.push(`Landing a high-paying Remote Frontend Job shouldn't take months of being ghosted - FrontendEngineers.com gives you the direct edge.`);
  }

  // Group lines intelligently (keep bullet items grouped nicely)
  let bodyText = '';
  for (let i = 0; i < nonHashLines.length; i++) {
    const curr = nonHashLines[i];
    const prev = i > 0 ? nonHashLines[i - 1] : null;
    const isCurrBullet = curr.startsWith('-') || curr.startsWith('•');
    const isPrevBullet = prev && (prev.startsWith('-') || prev.startsWith('•'));

    if (i === 0) {
      bodyText += curr;
    } else if (isCurrBullet && isPrevBullet) {
      bodyText += '\n' + curr;
    } else {
      bodyText += '\n\n' + curr;
    }
  }

  // 4. In-between links block as requested
  const linksBlock = `👉 Explore remote frontend jobs:\nhttps://www.frontendengineers.com\n\n👉 Get pro access for just $9/month:\nhttps://www.frontendengineers.com/pricing`;

  const uniqueTags = Array.from(new Set(hashTags)).slice(0, 4);
  const tagString = uniqueTags.length > 0
    ? uniqueTags.join(' ')
    : '#FrontendDeveloper #ReactJS #RemoteWork #TechJobs';

  // Construct final post: Catchy first line & body first -> Links in-between -> Hashtags at bottom
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

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('🚀 LinkedIn Auto-Poster (Remote Frontend Jobs, Referrals & Employer Hiring)');
  console.log('═'.repeat(65));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE - will not publish to LinkedIn\n');
  if (IS_LONG) console.log('📝 Long-form mode active (1200-1600 characters)\n');

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
    process.exit(1);
  }

  console.log('\n✅ LinkedIn posting complete!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
