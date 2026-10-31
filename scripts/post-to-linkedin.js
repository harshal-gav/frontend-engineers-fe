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

// High-engagement creative themes engineered for LinkedIn algorithm (Dwell time + "See more" clicks)
const CREATIVE_THEMES = [
  {
    name: 'Ghost Jobs Breakdown & Stale Listings',
    angle: 'Contrarian analysis of why 30%+ of remote listings on big boards are ghost jobs that expired weeks ago, and why verified daily updates give applicants a massive advantage.',
    hookStyle: 'Eye-opening, authentic, and contrarian.'
  },
  {
    name: 'The 2026 Frontend Hiring Reality',
    angle: 'Actionable breakdown of what companies are actually filtering for (Next.js App Router, TypeScript strict mode, Core Web Vitals, API orchestration) vs outdated requirements.',
    hookStyle: 'Insider, developer-first, and highly educational.'
  },
  {
    name: 'The Worldwide Remote Reality Check',
    angle: 'Exposing the hidden trap of listings labeled Worldwide Remote that secretly filter for US/EU timezones, and why transparent location eligibility saves developers dozens of wasted hours.',
    hookStyle: 'Relatable, empathetic, and empowering.'
  },
  {
    name: 'Bypassing the 500-Applicant ATS Filter',
    angle: 'Why the first 48 hours of a job opening decide 90% of interviews, and how applying directly to employer portals + employee referrals beats the resume black hole.',
    hookStyle: 'Tactical, strategic, and career-advancement oriented.'
  },
  {
    name: 'Direct Employer Applications vs Middleman Portals',
    angle: 'How applying directly to official employer career portals (Greenhouse, Lever, Ashby) gets 4x higher response rates than third-party job aggregator forms.',
    hookStyle: 'Direct, transparent, and high-impact.'
  }
];

// ─── Gemini AI Generation (Optimized for LinkedIn Algorithm Reach) ──

async function generatePostWithGemini() {
  const theme = CREATIVE_THEMES[Math.floor(Math.random() * CREATIVE_THEMES.length)];
  const randomSalt = Math.floor(Math.random() * 900000 + 100000);

  const prompt = `You are a top-tier LinkedIn tech voice and engineering founder who regularly earns thousands of impressions and comments.

Write an authentic, highly readable, value-packed LinkedIn post specifically for remote frontend and full-stack developers.

---
TODAY'S ANGLE:
- Theme: ${theme.name}
- Core Angle: ${theme.angle}
- Tone: ${theme.hookStyle}
(Random seed key: ${randomSalt} - use only for stylistic variety, never mention this number in the post text)

---
CRITICAL RULES FOR HIGH IMPRESSIONS (ALGORITHM OPTIMIZED):

1. THE FIRST 2 LINES (THE HOOK):
- Must be scroll-stopping, authentic, and intriguing.
- It must convince the developer to click "...see more" within 2 seconds.
- NEVER start with an advertisement, cheerleading slogan, or "Get Remote Frontend Jobs faster with FrontendEngineers.com".
- NEVER start with "Are you looking for a job?" or "Attention developers!".
- Start with a bold market fact, surprising observation, contrarian truth, or relatable developer frustration (e.g. ghost jobs, misleading remote tags, ATS filters, tech stack trends).

2. THE BODY (HIGH-DENSITY VALUE):
- Provide 4-6 concise, punchy insights or takeaways with clean line spacing.
- Mention modern, relevant technologies naturally: React, Next.js, TypeScript, Vue.
- Make it relatable, educational, and genuinely useful to a software engineer browsing LinkedIn.

3. THE WEBSITE & COMMUNITY MENTION:
- Mention how FrontendEngineers.com provides 100% verified remote frontend roles, zero ghost jobs, and direct employer application links.
- Note: The single link to FrontendEngineers.com is placed on top of the post. Do NOT include any secondary links or pricing links.

4. CALL TO ACTION & QUESTION:
- End with 1 thoughtful, engaging question to drive comments (the algorithm prioritizes posts with comment discussions).

5. HASHTAGS:
- Include EXACTLY 3 to 5 targeted, high-traffic hashtags at the very bottom:
#FrontendDeveloper #ReactJS #WebDevelopment #RemoteWork #TechJobs

---
CRITICAL RULES FOR LINKEDIN API:
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks. LinkedIn API displays raw markdown characters as ugly plaintext.
- NO PARENTHESES: DO NOT use parentheses '(' or ')' anywhere in the post. LinkedIn API silently truncates posts at '('. Use dashes - or commas instead.
- LENGTH: 1000 to 1400 characters (optimal for mobile reading dwell time).
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
                maxOutputTokens: 4000,
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

  // 2. Remove any stray CTA header lines that might have been generated
  cleaned = cleaned.replace(/^[ \t]*👉[^\n]*(?:remote|jobs|frontend|verified|pro|access|pricing)[^\n]*$/gim, '');
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
