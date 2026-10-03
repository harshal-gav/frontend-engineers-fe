#!/usr/bin/env node
/**
 * Automated LinkedIn Job Poster
 * 
 * Picks an unposted job from data/jobs.json, generates an engaging post
 * using Gemini AI, and publishes it to a LinkedIn Page.
 * 
 * Environment variables required:
 *   GEMINI_API_KEY          — Google Gemini API key
 *   LINKEDIN_ACCESS_TOKEN   — LinkedIn OAuth2 access token
 *   LINKEDIN_ORG_ID         — LinkedIn Organization (Page) ID
 * 
 * Flags:
 *   --dry-run    — Generate the post but don't publish to LinkedIn
 * 
 * Usage:
 *   node scripts/post-to-linkedin.js
 *   node scripts/post-to-linkedin.js --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const JOBS_PATH = path.join(ROOT, 'data', 'jobs.json');
const POSTED_PATH = path.join(ROOT, 'data', 'linkedin-posted.json');
const SITE_URL = 'https://www.frontendengineers.com';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Config ──────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
// Posts from your personal LinkedIn profile (uses "Share on LinkedIn" product)
const LINKEDIN_PERSON_ID = process.env.LINKEDIN_PERSON_ID;
const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY');
  process.exit(1);
}

// We will validate LinkedIn credentials during execution loop


// ─── Helpers ─────────────────────────────────────────────────

function loadJobs() {
  if (!fs.existsSync(JOBS_PATH)) {
    console.error('❌ data/jobs.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
}

function loadPostedIds() {
  if (!fs.existsSync(POSTED_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(POSTED_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function savePostedIds(ids) {
  fs.writeFileSync(POSTED_PATH, JSON.stringify(ids, null, 2) + '\n');
}

/**
 * Generate a slug for a job (matches the website's generateSlug function)
 */
function generateSlug(job) {
  if (job.slug) return job.slug;

  const fillerWords = /\b(the|and|in|a|an|of|for|with)\b/gi;
  const titlePart = job.title
    .toLowerCase()
    .replace(fillerWords, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
    .replace(/-+$/, '');

  const companyPart = (job.company?.name || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 20)
    .replace(/-+$/, '');

  const idSuffix = job.id.substring(0, 8);
  return `${titlePart}-at-${companyPart}-${idSuffix}`;
}

// ─── Gemini AI ───────────────────────────────────────────────

async function generatePostWithGemini() {
  const prompt = `You are a highly creative social media manager for FrontendEngineers.com - the only job board built exclusively for remote frontend developers.

Write an engaging, SHORT, and PUNCHY LinkedIn post to promote our website to job seekers. DO NOT promote a specific job.

**CRITICAL RULE: SHORT & EMOJI-RICH**
- DO NOT write long paragraphs. Keep sentences short, 1-2 lines max.
- USE EMOJIS liberally to break up text, highlight key points, and make the post visually engaging.
- Make it highly readable, skimmable, and snappy.

**CRITICAL RULE: USE THE PROVEN HIGH-CONVERTING STRUCTURE**
This script runs every 1 hour. You must strictly follow this exact structure to maximize engagement. Vary the exact wording, but KEEP THIS EXACT FLOW:

1. THE HOOK - First Line: Must open with a punchy, number-driven statement. Use one of these angles, varied each time:
   - "2,400+ remote frontend jobs. One place. Zero noise." 
   - "Save 20+ hours a week searching for jobs. We spend 0."
   - "100+ job boards. 2,400+ jobs. 1 search. FrontendEngineers.com."
   Always include "FrontendEngineers.com" in the first 2 lines.

2. THE PAIN POINT: 1-2 short sentences describing the specific pain of checking LinkedIn, Indeed, WeWorkRemotely, and 10+ other sites every day. Use numbers: "20+ hours wasted", "10 different tabs", "100+ sources we check for you".

3. THE PITCH - 3 Bullet Points with Emojis: Use exactly these three selling points with NUMBERS, formulated in short bullet points:
   - ⚡ 2,400+ REMOTE FRONTEND JOBS from 100+ sources - React, Vue, Angular, TypeScript, Next.js - all in one search
   - 🌍 100% REMOTE. 100% FRONTEND. Updated every 24 hours. No backend noise, no hybrid roles disguised as remote.
   - 🔍 AI-POWERED FILTERS - filter by tech stack, seniority, remote scope, and 15+ other criteria to find exactly what you want

4. CTA & PRICING: "Unlock all 2,400+ jobs for $9/mo. Cancel anytime." Keep it simple and direct. One price. One action.

5. LINKS: Format exactly like this:
   🔍 Browse 2,400+ remote frontend jobs:
   https://www.frontendengineers.com
   ⚡ Unlock All Jobs - $9/mo:
   https://www.frontendengineers.com/pricing

6. HASHTAGS: Include 5-8 relevant hashtags like #FrontendDeveloper #RemoteJobs #ReactJS #TypeScript #WebDev.

**IMPORTANT RULES & INSTRUCTIONS:**
- NO MARKDOWN OR PARENTHESES: DO NOT use markdown like **bold** or *italics*. DO NOT use parentheses \`()\` anywhere in the text. LinkedIn's API does not support them and will truncate the post. Use commas or dashes instead. DO NOT use markdown links like [text](url).
- Always use specific numbers: "2,400+", "100+", "20+", "$9/mo", "24 hours", "15+ criteria". NEVER use vague words like "many", "most", "fast", "hundreds".
- Vary the exact words you use but ALWAYS include the key numbers.
- Keep sentences short and punchy.

Write ONLY the post text, nothing else. Make it catchy, short, and highly readable.`;

  // Retry up to 3 times if the generated post is too short
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      // Retry on transient errors (rate limit, overload)
      if ((res.status === 429 || res.status === 503) && attempt < 3) {
        const waitSec = attempt * 10;
        console.log(`   ⚠️  Gemini API ${res.status}, retrying in ${waitSec}s (attempt ${attempt + 1}/3)...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini returned empty content');
    }

    const cleaned = text.trim();

    // If the post is too short (< 200 chars), retry
    if (cleaned.length < 200 && attempt < 3) {
      console.log(`   ⚠️  Post too short (${cleaned.length} chars), retrying (attempt ${attempt + 1}/3)...`);
      continue;
    }

    return cleaned;
  }

  throw new Error('Failed to generate a sufficiently long post after 3 attempts');
}

// ─── LinkedIn API ────────────────────────────────────────────

async function postToLinkedIn(text, authorUrn, accessToken) {
  // The LinkedIn API is notoriously buggy with Markdown and often silently truncates posts
  // if it encounters unmatched formatting characters, even when escaped.
  // Since we instructed the AI to output plain text, we strictly strip stray formatting chars.
  // We also remove Markdown links just in case the AI ignored the instruction.
  // Parentheses are also stripped because LinkedIn API silently truncates at `(`.
  let safeText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 - $2');
  safeText = safeText.replace(/[*_~<>`[\]()]/g, '');
  safeText = safeText.replace(/\r/g, '');

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
  console.log('🚀 LinkedIn Auto-Poster');
  console.log('═'.repeat(50));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE — will not post to LinkedIn\n');

  // 1. Generate post with Gemini
  console.log('\n🤖 Generating post with Gemini AI...');
  const postText = await generatePostWithGemini();

  console.log('\n📄 Generated post:');
  console.log('─'.repeat(50));
  console.log(postText);
  console.log('─'.repeat(50));

  // 2. Post to LinkedIn
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — Skipping LinkedIn publish');
    console.log(`   Post length: ${postText.length} characters`);
  } else {
    console.log('\n📤 Publishing to LinkedIn...');
    
    // Gather all configured LinkedIn accounts
    const accounts = [];
    
    // Base Account
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

    let successCount = 0;
    
    for (const acc of accounts) {
      console.log(`\n➡️  Target: ${acc.name}`);
      try {
        if (acc.personId) {
          console.log(`   Posting to Personal Profile (${acc.personId})...`);
          const resultPerson = await postToLinkedIn(postText, `urn:li:person:${acc.personId}`, acc.token);
          console.log(`   ✅ Posted to Personal Profile! Post ID: ${resultPerson.postId}`);
          successCount++;
        }

        if (acc.orgId) {
          console.log(`   Posting to Company Page (${acc.orgId})...`);
          const resultOrg = await postToLinkedIn(postText, `urn:li:organization:${acc.orgId}`, acc.token);
          console.log(`   ✅ Posted to Company Page! Post ID: ${resultOrg.postId}`);
          successCount++;
        }
      } catch (err) {
        console.error(`\n❌ Failed to post to ${acc.name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      console.log(`\n✅ Post successfully published to ${successCount} targets!`);
    } else {
      console.error('\n❌ No valid posts were made.');
      process.exit(1);
    }
  }

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
