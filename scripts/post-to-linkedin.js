#!/usr/bin/env node
/**
 * Automated LinkedIn Combined Poster (Job Seekers + Employer Ads)
 * 
 * Generates TWO distinct posts in a SINGLE Gemini AI prompt/API call:
 *   1. Remote Frontend Developer Career Post (promoting FrontendEngineers.com)
 *   2. Employer Hiring Post (promoting the $99/mo Unlimited Hiring Plan)
 * 
 * Then publishes BOTH posts to all configured LinkedIn accounts with a rate-limit safe delay.
 * Runs on a schedule every 2 hours via GitHub Actions.
 * 
 * Environment variables required:
 *   GEMINI_API_KEY          — Google Gemini API key
 *   LINKEDIN_ACCESS_TOKEN   — LinkedIn OAuth2 access token
 *   LINKEDIN_PERSON_ID      — LinkedIn Person URN ID (optional)
 *   LINKEDIN_ORG_ID         — LinkedIn Organization URN ID (optional)
 * 
 * Flags:
 *   --dry-run    — Generate both posts but don't publish to LinkedIn
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
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite'
];

// ─── Gemini AI Generation (Single Prompt for Both Posts) ─────

async function generateBothPostsWithGemini() {
  const prompt = `You are an expert social media strategist and B2B growth marketing manager for FrontendEngineers.com - the premier job board built exclusively for remote frontend developers.

Generate TWO distinct, high-converting LinkedIn posts in this exact format with the exact delimiter tags:

===JOB_POST_START===
[Full text of Post 1 here]
===JOB_POST_END===

===EMPLOYER_POST_START===
[Full text of Post 2 here]
===EMPLOYER_POST_END===

---
INSTRUCTIONS FOR POST 1 (Target: Remote Frontend Developers looking for jobs):
- POSITIVE TONE ONLY: Inspiring, uplifting, and empowering. No negative hooks like "Tired of..." or "Sick of...".
- FIRST LINE REQUIREMENT: You MUST explicitly mention the exact phrase "Remote Frontend Developer Job" and the website "FrontendEngineers.com" in the VERY FIRST line of the post. Example: "Find your dream Remote Frontend Developer Job today at FrontendEngineers.com! 🚀"
- CORE MESSAGE: You will find an incredible remote frontend job from this website. Emphasize remote work benefits, mastering frontend technologies like React, Next.js, Vue, and TypeScript, and how we aggregate from 100+ sources so they never miss an opportunity.
- USE LOTS OF EMOJIS: 🚀✨🔥💻 (make it vibrant and eye-catching).
- LINKS REQUIRED (format as plain text):
  🔍 Find your remote frontend job:
  https://www.frontendengineers.com
  ⚡ Unlock All Jobs - $9/mo:
  https://www.frontendengineers.com/pricing
- ENGAGEMENT: Strong call to action asking them to comment and repost to help their network.
- HASHTAGS: 25-35 optimized hashtags (#FrontendDeveloper #RemoteJobs #ReactJS #TypeScript #WebDev, etc.).
- LENGTH: 1000 - 1800 characters.

---
INSTRUCTIONS FOR POST 2 (Target: Tech Recruiters, Startup Founders, Engineering Managers):
- FIRST LINE HOOK: Must open with a number-driven statement about hiring frontend engineers and include "FrontendEngineers.com" in the first 2 lines. Example: "Your job post reaches 5,000+ frontend developers in 24 hours. FrontendEngineers.com."
- PAIN POINT: 1-2 short punchy sentences highlighting that 1 job post on LinkedIn costs $300+, Indeed costs $2,000+ for 10 posts, and generic boards are full of unqualified noise.
- 4 BULLET POINTS WITH EMOJIS & NUMBERS:
  - 🎯 100% FRONTEND AUDIENCE - React, Next.js, Vue, Angular, TypeScript engineers only.
  - 📩 5,000+ INBOXES - Lands in 5,000+ frontend developer subscriber inboxes.
  - ⭐ UNLIMITED POSTS - Post 1 job or 100. $99/mo flat with no per-post fees.
  - 💰 10x CHEAPER - One post on LinkedIn is $300+. Post unlimited here for $99/mo.
- CTA: "Reach 5,000+ frontend developers for $99/mo. Cancel anytime."
- LINK REQUIRED (format as plain text):
  👇 Start posting unlimited jobs:
  https://www.frontendengineers.com/employers/pricing
- HASHTAGS: 5-8 hashtags like #Hiring #TechRecruitment #FrontendEngineers #Startups #RemoteHiring.

---
CRITICAL RULES FOR BOTH POSTS:
- NO MARKDOWN: Absolutely NO **bold**, NO *italics*, NO backticks.
- NO PARENTHESES: DO NOT use parentheses anywhere in the text. LinkedIn API silently truncates posts at '('. Use dashes or commas instead.
- Output ONLY the requested delimiters and posts, nothing else.`;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`   Trying model: ${model} (attempt ${attempt}/2)...`);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 4096,
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
          // Break to next model on 429 or fatal error
          break;
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`   ⚠️ Gemini ${model} returned empty content.`);
          break;
        }

        // Extract both posts using delimiters
        const jobMatch = text.match(/===JOB_POST_START===([\s\S]*?)===JOB_POST_END===/);
        const empMatch = text.match(/===EMPLOYER_POST_START===([\s\S]*?)===EMPLOYER_POST_END===/);

        const jobPost = jobMatch ? jobMatch[1].trim() : null;
        const employerPost = empMatch ? empMatch[1].trim() : null;

        if (!jobPost || !employerPost) {
          console.warn(`   ⚠️ Delimiters not cleanly matched. Trying fallback extraction...`);
          // Fallback if delimiters were slightly malformed
          const parts = text.split(/===+.*POST.*===+/i).filter(p => p.trim().length > 100);
          if (parts.length >= 2) {
            return {
              jobPost: parts[0].trim(),
              employerPost: parts[1].trim()
            };
          }
          continue;
        }

        if (jobPost.length < 300 || employerPost.length < 200) {
          console.warn(`   ⚠️ One of the posts was too short (job: ${jobPost.length}, emp: ${employerPost.length}). Retrying...`);
          continue;
        }

        return { jobPost, employerPost };
      } catch (err) {
        console.warn(`   ⚠️ Exception calling Gemini model ${model}: ${err.message}`);
      }
    }
  }

  throw new Error('Failed to generate posts after exhausting available Gemini models');
}

// ─── LinkedIn Helpers ────────────────────────────────────────

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
  console.log('🚀 LinkedIn Combined Auto-Poster (Job + Employer Ad)');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE — will not publish to LinkedIn\n');

  // 1. Generate both posts in a SINGLE Gemini AI call
  console.log('\n🤖 Generating BOTH posts with Gemini AI (single API request)...');
  const { jobPost, employerPost } = await generateBothPostsWithGemini();

  console.log('\n📄 [1/2] Candidate Job Post:');
  console.log('─'.repeat(60));
  console.log(sanitizeForLinkedIn(jobPost));
  console.log('─'.repeat(60));
  console.log(`Length: ${jobPost.length} chars`);

  console.log('\n📄 [2/2] Employer Ad Post:');
  console.log('─'.repeat(60));
  console.log(sanitizeForLinkedIn(employerPost));
  console.log('─'.repeat(60));
  console.log(`Length: ${employerPost.length} chars`);

  if (DRY_RUN) {
    console.log('\n✅ DRY RUN complete. Both posts successfully generated with 1 API call!');
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

  console.log(`\n📤 Publishing to ${accounts.length} LinkedIn account(s)...`);

  let totalPublished = 0;

  for (const acc of accounts) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`➡️  Target Account: ${acc.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Target URNs for this account
    const targets = [];
    if (acc.personId) targets.push({ type: 'Personal Profile', urn: `urn:li:person:${acc.personId}` });
    if (acc.orgId) targets.push({ type: 'Company Page', urn: `urn:li:organization:${acc.orgId}` });

    for (const target of targets) {
      // 1. Post Candidate Job Post
      try {
        console.log(`\n   [1/2] Posting Candidate Job Post to ${target.type} (${target.urn})...`);
        const res1 = await postToLinkedIn(jobPost, target.urn, acc.token);
        console.log(`   ✅ Posted Job Post! Post ID: ${res1.postId}`);
        totalPublished++;
      } catch (err) {
        console.error(`   ❌ Failed to post Job Post to ${target.type}: ${err.message}`);
      }

      // Safety delay between posts to prevent spam detection or rate limiting
      console.log('   ⏳ Waiting 15s before posting Employer Ad...');
      await new Promise(r => setTimeout(r, 15000));

      // 2. Post Employer Ad
      try {
        console.log(`   [2/2] Posting Employer Ad to ${target.type} (${target.urn})...`);
        const res2 = await postToLinkedIn(employerPost, target.urn, acc.token);
        console.log(`   ✅ Posted Employer Ad! Post ID: ${res2.postId}`);
        totalPublished++;
      } catch (err) {
        console.error(`   ❌ Failed to post Employer Ad to ${target.type}: ${err.message}`);
      }
    }
  }

  if (totalPublished > 0) {
    console.log(`\n🎉 Successfully published ${totalPublished} post(s) to LinkedIn!`);
  } else {
    console.error('\n❌ No posts were published successfully.');
    process.exit(1);
  }

  console.log('\n✅ All done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
