#!/usr/bin/env node
/**
 * Automated LinkedIn Job Poster for Employers
 * 
 * Generates an engaging post using Gemini AI to promote the $99 Employer Unlimited Plan,
 * and publishes it to a LinkedIn Page.
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
 *   node scripts/post-to-linkedin-employers.js
 *   node scripts/post-to-linkedin-employers.js --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

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

if (!DRY_RUN && (!LINKEDIN_ACCESS_TOKEN || (!LINKEDIN_PERSON_ID && !LINKEDIN_ORG_ID))) {
  console.error('❌ Missing LINKEDIN_ACCESS_TOKEN or (LINKEDIN_PERSON_ID / LINKEDIN_ORG_ID)');
  process.exit(1);
}

// ─── Gemini AI ───────────────────────────────────────────────

async function generatePostWithGemini() {
  const prompt = `You are an aggressive, highly persuasive B2B marketing manager for FrontendEngineers.com, the premier job board for remote frontend developers.

Write an engaging LinkedIn post to sell our Employer Hiring Plan to tech recruiters, startup founders, and engineering managers.

**CRITICAL RULE: USE THE PROVEN HIGH-CONVERTING STRUCTURE**
This script runs every 4 hours. You must strictly follow this exact structure to maximize engagement. Vary the exact wording, but KEEP THIS EXACT FLOW:

1. THE HOOK (First Line): Must ask a question about hiring frontend engineers and include the website name "FrontendEngineers.com". (e.g., "🔥 Are you hiring frontend engineers? FrontendEngineers.com is the smartest way to scale your dev team this year.")
2. THE PAIN POINT: 1-2 short sentences acknowledging the frustration of finding qualified React/Vue/TypeScript talent and burning money on recruiters or generic job boards.
3. THE PITCH (4 Bullet Points with Emojis): Use exactly these selling points, formulated in short bullet points:
   - 🎯 MASSIVE TARGETED REACH (Access 100,000+ monthly active frontend developers looking for remote roles)
   - 📩 INSTANT INBOX DELIVERY (Your job gets blasted directly to our users' inboxes the moment it is posted)
   - ⭐ VIP VISIBILITY (Your roles appear at the very top of the board)
   - 💰 UNBEATABLE VALUE (Get Unlimited Job Postings for a flat 99 USD/month! No per-post fees, no hidden costs)
4. CTA: Add a strong call to action to scale their engineering team faster without blowing their budget.
5. LINKS: Format exactly like this:
   👇 Lock in your plan here:
   https://www.frontendengineers.com/employers/pricing
6. HASHTAGS: Include 5-8 relevant hashtags like #Hiring #TechRecruitment #FrontendEngineers #Startups.

**IMPORTANT RULES & INSTRUCTIONS:**
- NO MARKDOWN OR PARENTHESES: DO NOT use markdown like **bold** or *italics*. DO NOT use parentheses \`()\` anywhere in the text. LinkedIn's API does not support them and will truncate the post. Use commas or dashes instead. DO NOT use markdown links like [text](url).
- Vary the exact words you use to introduce the bullet points (e.g., "Here is why top companies are making the switch:", "Here is what you get when you hire through us:").
- Keep sentences short and punchy.

Write ONLY the post text, nothing else. Make it compelling and highly readable.`;

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

async function postToLinkedIn(text, authorUrn) {
  // The LinkedIn API is notoriously buggy with Markdown and often silently truncates posts
  // if it encounters unmatched formatting characters, even when escaped.
  // Since we instructed the AI to output plain text, we strictly strip stray formatting chars.
  // We also remove Markdown links just in case the AI ignored the instruction.
  let safeText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  safeText = safeText.replace(/[*_~<>`[\]]/g, '');

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
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
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
  console.log('🚀 LinkedIn Employer Promo Auto-Poster');
  console.log('═'.repeat(50));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE — will not post to LinkedIn\n');

  // 1. Generate post with Gemini
  console.log('\n🤖 Generating employer promo post with Gemini AI...');
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
    let successCount = 0;
    try {
      if (LINKEDIN_PERSON_ID) {
        console.log('   Posting to Personal Profile...');
        const resultPerson = await postToLinkedIn(postText, `urn:li:person:${LINKEDIN_PERSON_ID}`);
        console.log(`   ✅ Posted to Personal Profile! Post ID: ${resultPerson.postId}`);
        successCount++;
      }
      
      if (LINKEDIN_ORG_ID) {
        console.log('   Posting to Company Page...');
        const resultOrg = await postToLinkedIn(postText, `urn:li:organization:${LINKEDIN_ORG_ID}`);
        console.log(`   ✅ Posted to Company Page! Post ID: ${resultOrg.postId}`);
        successCount++;
      }
      
      if (successCount > 0) {
        console.log(`\n✅ Post successful!`);
      } else {
        console.error('\n❌ No valid LinkedIn IDs configured. Skipping update.');
      }
    } catch (err) {
      console.error(`\n❌ Failed to post: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
