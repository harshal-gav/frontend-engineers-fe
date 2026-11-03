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

// High-engagement creative themes engineered for short, punchy $9 Pro conversions
const CREATIVE_THEMES = [
  {
    name: 'Skip the 500-Applicant ATS Queue',
    angle: 'Stop applying to stale ghost jobs through free aggregators. For $9/month, Pro gives you direct 1-click ATS application links and employee referrals so your resume actually reaches hiring teams.',
    hookStyle: 'Direct, provocative, and zero fluff.'
  },
  {
    name: 'The $9 Career Investment vs Months of Ghosting',
    angle: 'A remote frontend role pays $120k-$200k+. Why spend 6 months unemployed applying on broken free boards to save $9? FrontendEngineers.com Pro gives you the unfair advantage.',
    hookStyle: 'Punchy mathematical reality check.'
  },
  {
    name: 'Why Aggregators Are A Trap For Frontend Devs',
    angle: 'Free job boards feed you expired listings and 800-applicant queues. Pro gives you 100% verified remote roles, direct ATS links, and referrals for just $9/month ($0.30/day).',
    hookStyle: 'Exposing the broken system.'
  },
  {
    name: 'Apply In The First 30 Minutes',
    angle: '90% of remote frontend callbacks go to the first 50 applicants on the company ATS. Pro alerts and direct links put you in the first 10 for $9/month.',
    hookStyle: 'Tactical, urgent speed advantage.'
  }
];

// ─── Gemini AI Generation (Optimized for LinkedIn Reach & Conversions) ──

async function generatePostWithGemini() {
  const theme = CREATIVE_THEMES[Math.floor(Math.random() * CREATIVE_THEMES.length)];
  const randomSalt = Math.floor(Math.random() * 900000 + 100000);

  const prompt = `You are a high-converting tech career advisor and engineering founder.

Write an ULTRA-SHORT, punchy, high-converting LinkedIn post (strictly 450 to 650 characters) that gets straight to the point about what FrontendEngineers.com Pro sells for $9/month.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
CRITICAL POST STRUCTURE & CONVERSION RULES:

1. THE HOOK (1-2 SHORT LINES):
- Scroll-stopping reality: mass-applying on free job boards is sending resumes into a black hole of 800+ applicants and ghost jobs.
- Get straight to the point. No fluff.

2. WHAT WE SELL FOR $9/MONTH (CLEAR, DIRECT BULLETS):
For $9/month - literally $0.30 a day - FrontendEngineers.com Pro gives you:
- Direct 1-click ATS links: Apply directly on Greenhouse, Lever, Ashby - skip aggregators.
- Employee referrals: Get internal referrals to bypass the ATS filter entirely.
- 850+ vetted remote roles: Verified salaries from $120k to $200k+.
- Real-time instant alerts: Apply in the first 30 minutes before hundreds flood the role.

3. PRICE & ROI (1 SENTENCE):
Just $9/month - $0.30 a day, cancel anytime with 1 click. Landing one $120k+ remote role pays for this thousands of times over.

4. DIRECT CALL TO ACTION WITH PRICING LINK:
Include the exact pricing link:
👉 Get Pro access: frontendengineers.com/pricing

5. HASHTAGS:
Include 3 to 4 targeted hashtags at the very bottom:
#FrontendDeveloper #ReactJS #RemoteWork #TechJobs

---
CRITICAL RULES FOR LINKEDIN API:
- VERY SHORT: Strictly 450 to 650 characters. Keep it brief, crisp, and to the point.
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use '(' or ')'. Use dashes - or commas instead. LinkedIn API truncates on parentheses.
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

  // 1. Normalize pricing page link to clean "frontendengineers.com/pricing"
  cleaned = cleaned.replace(/https?:\/\/(www\.)?frontendengineers\.com\/pricing[^\s\n]*/gi, 'frontendengineers.com/pricing');
  cleaned = cleaned.replace(/https?:\/\/(www\.)?frontendengineers\.com[^\s\n]*/gi, 'frontendengineers.com/pricing');
  cleaned = cleaned.replace(/https?:\/\/[^\s\n]*/gi, '');
  cleaned = cleaned.replace(/www\.frontendengineers\.com\/pricing/gi, 'frontendengineers.com/pricing');
  cleaned = cleaned.replace(/www\.frontendengineers\.com/gi, 'frontendengineers.com');

  // 2. Normalize excess spacing
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Top anchor link to pricing page
  const topLinkBlock = `frontendengineers.com/pricing`;

  // 3. Separate hashtags from post content
  const lines = cleaned.split('\n');
  const nonHashLines = [];
  const hashTags = [];

  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      const tags = line.trim().match(/#[a-zA-Z0-9_]+/g);
      if (tags) hashTags.push(...tags);
    } else {
      // Skip if this line is just the standalone link to avoid duplicating the top line
      if (line.trim().toLowerCase() === 'frontendengineers.com/pricing' || line.trim().toLowerCase() === 'frontendengineers.com') {
        continue;
      }
      nonHashLines.push(line);
    }
  }

  const uniqueTags = Array.from(new Set(hashTags)).slice(0, 4);
  const tagString = uniqueTags.length > 0
    ? uniqueTags.join(' ')
    : '#FrontendDeveloper #ReactJS #RemoteWork #TechJobs';

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
