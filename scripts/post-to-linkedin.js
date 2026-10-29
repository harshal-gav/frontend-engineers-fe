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
const WITH_TWITTER = process.argv.includes('--with-twitter') || process.argv.includes('--twitter');

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

// Creative rotating angles to guarantee distinct, varied posts on each run
const CREATIVE_THEMES = [
  {
    name: 'Verified Quality & Zero Ghost Jobs',
    angle: 'Focus on the relief and speed of browsing 100% verified, active frontend roles with zero ghost jobs, zero expired links, and direct application portals.',
    hookTone: 'Energizing, refreshing, and action-oriented.'
  },
  {
    name: 'Modern Tech Stack Deep Dive',
    angle: 'Focus on high-demand modern frontend technologies - React, Next.js, TypeScript, Vue 3, and Angular - curated specifically for frontend engineers and UI architects.',
    hookTone: 'Tech-enthusiast, forward-looking, and developer-centric.'
  },
  {
    name: 'Worldwide Remote Freedom',
    angle: 'Focus on location independence and transparent remote policies - Worldwide Remote, US, Europe/UK, LATAM, Canada, APAC - with no hidden hybrid surprises.',
    hookTone: 'Empowering, global, and lifestyle-freedom oriented.'
  },
  {
    name: 'Direct Employer Application Links',
    angle: 'Focus on transparency and cutting out middlemen: every role links directly to official employer career portals with full specs and salary ranges where available.',
    hookTone: 'Transparent, direct, and straightforward.'
  },
  {
    name: 'Beating the ATS with Daily Alerts & Referrals',
    angle: 'Focus on applying fast: daily tailored job alerts straight to inbox plus direct employee referrals to bypass automated filter traps and land interviews.',
    hookTone: 'Strategic, competitive edge, and career advancement.'
  },
  {
    name: 'High-Impact Startups & Global Tech Leaders',
    angle: 'Focus on finding high-growth startup and enterprise frontend engineering roles that elevate your portfolio and compensation.',
    hookTone: 'Ambitious, inspiring, and high-impact.'
  }
];

// High-energy variations of the mandatory first line concept
const FASTER_OPENING_HOOKS = [
  'Get Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🚀',
  'Land your dream Remote Frontend Job faster than ever with FrontendEngineers.com! ⚡',
  'Find verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! ✨',
  'Score top-tier Remote Frontend Jobs faster than ever with FrontendEngineers.com! 💻',
  'Get hired for verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🔥',
  'Unlock high-impact Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🎯',
  'Fast-track your search for Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🌟',
  'Discover verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🚀',
  'Secure interview-ready Remote Frontend Jobs faster than ever with FrontendEngineers.com! ⚡',
  'Step into your next Remote Frontend Job faster than ever with FrontendEngineers.com! 💼'
];

// ─── Gemini AI Generation (Single Post with Jobs as Dominant Focus) ─

async function generatePostWithGemini() {
  const theme = CREATIVE_THEMES[Math.floor(Math.random() * CREATIVE_THEMES.length)];
  const suggestedOpeningHook = FASTER_OPENING_HOOKS[Math.floor(Math.random() * FASTER_OPENING_HOOKS.length)];
  const randomSalt = Math.floor(Math.random() * 900000 + 100000);

  const prompt = `You are an expert social media strategist and growth marketing lead for FrontendEngineers.com - the premier platform built exclusively for remote frontend developers.

Generate a SINGLE high-converting LinkedIn post that combines remote frontend jobs, community employee referrals, and employer hiring, with DOMINANT, FULL FOCUS on helping developers land remote frontend developer jobs.

---
TODAY'S UNIQUE CREATIVE FOCUS (Use this to make this post completely fresh and distinct):
- Focus Angle: ${theme.name}
- Creative Direction: ${theme.angle}
- Hook Style: ${theme.hookTone}
- Random Seed Key: ${randomSalt}
Every post generated MUST feel original, engaging, and different from previous posts in rhythm, storytelling, phrasing, and structure.

---
MANDATORY OPENING REQUIREMENT (NON-NEGOTIABLE):
The VERY FIRST line/sentence of the post MUST open with a creative variation of:
"Get Remote Frontend Jobs faster than ever with FrontendEngineers.com"

Suggested variation for this post:
"${suggestedOpeningHook}"

You can use this suggested variation or craft a compelling, fresh variation of it. It MUST prominently include:
1. "Remote Frontend Job" (or "Remote Frontend Jobs")
2. "faster than ever" (highlighting speed and efficiency)
3. The exact website name "FrontendEngineers.com"

Examples of variations to rotate and inspire from:
- "Get Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🚀"
- "Land your dream Remote Frontend Job faster than ever with FrontendEngineers.com! ⚡"
- "Find verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! ✨"
- "Score top-tier Remote Frontend Jobs faster than ever with FrontendEngineers.com! 💻"
- "Get hired for verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🔥"
- "Unlock high-impact Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🎯"
- "Fast-track your search for Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🌟"
- "Discover verified Remote Frontend Jobs faster than ever with FrontendEngineers.com! 🚀"

---
CONTENT & STRUCTURE REQUIREMENTS:

1. OPENING (1-2 lines):
- Start with the mandatory opening variation of "Get Remote Frontend Jobs faster than ever with FrontendEngineers.com".
- POSITIVE, EMPOWERING, AND INSPIRING TONE ONLY: No negative complaints like "Tired of..." or "Sick of...". Focus on excitement, speed of landing interviews, and transparent opportunities.

2. CORE SECTION - FULL FOCUS ON REMOTE FRONTEND DEVELOPER JOBS (75-80% of post):
- Make this the clear highlight of the post with rich details, vibrant emojis, and genuine value:
  • 100% VERIFIED & DEDUPLICATED: Exclusively curated frontend engineering roles across React, Next.js, Vue, Angular, and TypeScript. Zero ghost jobs, zero expired listings, and zero dead application links.
  • ACCURATE REMOTE LOCATIONS: Transparent remote eligibility - Worldwide Remote, US, Europe/UK, LATAM, Canada, and APAC - so engineers never waste time on mislabeled hybrid positions.
  • DIRECT EMPLOYER APPLICATION LINKS: Full job specifications linking directly to official employer career portals with zero middlemen.
  • DAILY MATCHING ALERTS: Tailored job alerts delivered straight to your inbox daily so you can apply early.

3. MINIMAL MENTION 1 - COMMUNITY EMPLOYEE REFERRALS (10% of post):
- Keep this concise and subtle (1-2 sentences):
  • Mention that developers can also discover direct employee referrals from working frontend peers to bypass automated ATS filters and get interviews faster, or post their own referrals for free to support the developer community.

4. MINIMAL MENTION 2 - EMPLOYER HIRING (5-10% of post):
- Keep this to 1 short, punchy sentence:
  • "Hiring frontend talent? Founders and tech recruiters can post unlimited remote frontend roles for a flat $99/mo with zero per-post fees at FrontendEngineers.com."

5. STRICT LINK REQUIREMENT (INCLUDE ONLY THESE EXACT 2 LINKS - DO NOT INCLUDE ANY OTHER LINKS):
👉 Explore remote frontend jobs:
https://www.frontendengineers.com

👉 Get pro access for just $9/month:
https://www.frontendengineers.com/pricing

6. ENGAGEMENT & COMMUNITY CALL TO ACTION:
- Ask a fresh, high-engagement question tailored to today's topic (e.g. asking about tech stack, remote preferences, or dream projects).
- Call to action: "Repost this to help a fellow frontend developer find their next verified remote role! 🚀"

7. HASHTAGS:
- 20-25 highly relevant hashtags:
  #FrontendDeveloper #RemoteJobs #ReactJS #TypeScript #Nextjs #WebDev #JavaScript #VueJS #Angular #SoftwareEngineering #TechCareers #RemoteWork #JobSearch #Hiring #FrontendJobs #WebDevelopment #FrontendEngineers

---
CRITICAL RULES FOR LINKEDIN API:
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks. LinkedIn API displays raw markdown characters as ugly plaintext.
- NO PARENTHESES: DO NOT use parentheses anywhere in the text. LinkedIn API silently truncates posts at '('. Use dashes - or commas , instead.
- LENGTH: 1100 to 1800 characters (optimal for LinkedIn algorithm dwell time and readability).
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
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 6000,
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

        // Guarantee that the opening mentions both "Remote Frontend Developer jobs" and "FrontendEngineers.com"
        post = enforceMandatoryOpening(post);

        // Guarantee strictly only the 2 required links are kept
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

function enforceMandatoryOpening(text) {
  let cleaned = text.trim();
  const firstLines = cleaned.split('\n').slice(0, 3).join(' ');

  const hasJobs = /remote frontend (developer )?jobs?/i.test(firstLines);
  const hasSite = /frontendengineers\.com/i.test(firstLines);
  const hasFaster = /faster/i.test(firstLines);

  if (!hasJobs || !hasSite || !hasFaster) {
    const hook = FASTER_OPENING_HOOKS[Math.floor(Math.random() * FASTER_OPENING_HOOKS.length)];
    const lines = cleaned.split('\n');
    if (lines[0].includes('FrontendEngineers.com') || lines[0].toLowerCase().includes('frontend')) {
      lines[0] = hook;
      cleaned = lines.join('\n');
    } else {
      cleaned = `${hook}\n\n${cleaned}`;
    }
  }

  return cleaned;
}

function enforceAllowedLinks(text) {
  let cleaned = text;

  // Remove any legacy /referrals or /employers/pricing URLs if accidentally generated
  cleaned = cleaned.replace(/https?:\/\/www\.frontendengineers\.com\/referrals\S*/gi, '');
  cleaned = cleaned.replace(/https?:\/\/www\.frontendengineers\.com\/employers\/pricing\S*/gi, '');

  const targetLinksBlock = `👉 Explore remote frontend jobs:\nhttps://www.frontendengineers.com\n\n👉 Get pro access for just $9/month:\nhttps://www.frontendengineers.com/pricing`;

  // Match from any link-intro line preceding frontendengineers.com up to the pricing link
  const linkSectionRegex = /(?:[^\n]*(?:remote|jobs|explore|pro|access|pricing)[^\n]*\n+)?https:\/\/www\.frontendengineers\.com[\s\S]*?https:\/\/www\.frontendengineers\.com\/pricing/i;

  if (linkSectionRegex.test(cleaned)) {
    cleaned = cleaned.replace(linkSectionRegex, targetLinksBlock);
  } else if (cleaned.includes('https://www.frontendengineers.com')) {
    cleaned = cleaned.replace(
      /(?:[^\n]*\n+)?https:\/\/www\.frontendengineers\.com/i,
      targetLinksBlock
    );
  } else {
    const hashIndex = cleaned.search(/#[a-zA-Z]/);
    if (hashIndex !== -1) {
      cleaned = `${cleaned.substring(0, hashIndex).trim()}\n\n${targetLinksBlock}\n\n${cleaned.substring(hashIndex).trim()}`;
    } else {
      cleaned = `${cleaned}\n\n${targetLinksBlock}`;
    }
  }

  // Deduplicate any repeated consecutive label lines if any slipped through
  cleaned = cleaned.replace(/(👉 Explore remote frontend jobs:\s*\n)+/g, '👉 Explore remote frontend jobs:\n');
  cleaned = cleaned.replace(/(👉 Get pro access for just \$9\/month:\s*\n)+/g, '👉 Get pro access for just $9/month:\n');

  return cleaned;
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
    if (WITH_TWITTER) {
      console.log('\n🐦 Running Twitter/X Dry Run (--with-twitter)...');
      try {
        const { postThreeTweetsToTwitter, generateThreeTwitterPostsWithGemini } = require('./post-to-twitter');
        const twitterPosts = await generateThreeTwitterPostsWithGemini();
        await postThreeTweetsToTwitter({
          ...twitterPosts,
          dryRun: true,
          headed: process.argv.includes('--headed'),
        });
      } catch (twErr) {
        console.error('❌ Twitter dry run error:', twErr.message);
      }
    }
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
        console.error(`   ❌ Failed to post to ${target.type}: ${err.message}`);
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

  if (WITH_TWITTER) {
    console.log('\n🐦 Publishing to Twitter/X as requested (--with-twitter)...');
    try {
      const { postThreeTweetsToTwitter, generateThreeTwitterPostsWithGemini } = require('./post-to-twitter');
      console.log('🤖 Generating Twitter-optimized posts with Gemini AI...');
      const twitterPosts = await generateThreeTwitterPostsWithGemini();
      await postThreeTweetsToTwitter({
        ...twitterPosts,
        dryRun: DRY_RUN,
        headed: process.argv.includes('--headed'),
      });
    } catch (twErr) {
      console.error('❌ Error publishing to Twitter/X:', twErr.message);
    }
  }

  console.log('\n✅ All tasks done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
