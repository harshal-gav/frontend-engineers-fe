#!/usr/bin/env node
/**
 * Automated LinkedIn Combined Poster (Job Seekers + Employer Ads + Community Referrals)
 * 
 * Generates THREE distinct posts in a SINGLE Gemini AI prompt/API call:
 *   1. Remote Frontend Jobs & Referrals Post (all in one place for devs)
 *   2. Employer Hiring Post (promoting the $99/mo Unlimited Hiring Plan)
 *   3. Community Referral Contribution Post (free referral posting to support frontend devs)
 * 
 * Then publishes ALL THREE posts to all configured LinkedIn accounts with rate-limit safe delays.
 * Runs on a schedule every 2 hours via GitHub Actions.
 * 
 * Environment variables required:
 *   GEMINI_API_KEY          - Google Gemini API key
 *   LINKEDIN_ACCESS_TOKEN   - LinkedIn OAuth2 access token
 *   LINKEDIN_PERSON_ID      - LinkedIn Person URN ID (optional)
 *   LINKEDIN_ORG_ID         - LinkedIn Organization URN ID (optional)
 * 
 * Flags:
 *   --dry-run    - Generate all three posts but don't publish to LinkedIn
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
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite'
];

// ─── Gemini AI Generation (Single Prompt for 3 Posts) ─────────

async function generateThreePostsWithGemini() {
  const prompt = `You are an expert social media strategist and B2B growth marketing manager for FrontendEngineers.com - the premier platform built exclusively for remote frontend developers.

Generate THREE distinct, high-converting LinkedIn posts in this exact format with the exact delimiter tags:

===JOB_POST_START===
[Full text of Post 1 here]
===JOB_POST_END===

===EMPLOYER_POST_START===
[Full text of Post 2 here]
===EMPLOYER_POST_END===

===REFERRAL_POST_START===
[Full text of Post 3 here]
===REFERRAL_POST_END===

---
INSTRUCTIONS FOR POST 1 (Target: Remote Frontend Developers looking for jobs & referrals in one place):
- POSITIVE TONE ONLY: Inspiring, uplifting, and empowering. No negative hooks like "Tired of..." or "Sick of...".
- FIRST LINE REQUIREMENT: You MUST explicitly mention that developers can get "Remote Frontend Developer Jobs" and "Referrals" all in one place at "FrontendEngineers.com" in the VERY FIRST line of the post. Example: "Get remote frontend developer jobs and direct employee referrals all in one place at FrontendEngineers.com! 🚀"
- CORE MESSAGE: Highlight that FrontendEngineers.com is the single destination where frontend developers can access remote job links AND direct employee referrals side-by-side. Emphasize remote work benefits, top frontend tech stacks like React, Next.js, Vue, and TypeScript, aggregated roles from 100+ top sources, and direct community referrals to help candidates bypass applicant tracking systems and land interviews faster.
- USE LOTS OF EMOJIS: 🚀✨🔥💻🤝💼 (make it vibrant and eye-catching).
- LINKS REQUIRED (format as plain text):
  🔍 Find Remote Frontend Jobs & Referrals:
  https://www.frontendengineers.com
  🤝 Explore Community Referrals:
  https://www.frontendengineers.com/referrals
  ⚡ Unlock All Jobs & Referrals - $9/mo:
  https://www.frontendengineers.com/pricing
- ENGAGEMENT: Strong call to action asking them to comment their tech stack and repost to help their developer friends find jobs and referrals in one place.
- HASHTAGS: 25-35 optimized hashtags (#FrontendDeveloper #RemoteJobs #ReactJS #TypeScript #WebDev #JobReferrals #TechCareers, etc.).
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
INSTRUCTIONS FOR POST 3 (Target: Working Frontend Developers, Tech Leads & Engineers with referrals to give):
- FIRST LINE HOOK: Must inspire frontend engineers to post their referrals for free to support and help fellow frontend developers, explicitly mentioning "FrontendEngineers.com" in the first 2 lines. Example: "Post your referral on FrontendEngineers.com to support remote frontend developers - it is 100% free and helps a fellow engineer get hired! 🤝"
- CORE MESSAGE - SUPPORT & EMPOWER THE FRONTEND COMMUNITY:
  1. POST YOUR REFERRAL TO SUPPORT REMOTE FRONTEND DEVELOPERS: If your company is hiring remote frontend engineers (React, Next.js, Vue, TypeScript), post your referral to help a fellow developer land an interview.
  2. IT IS 100% FREE: No fees, no account required, no catch. Posting a referral is completely free to give back to the developer community.
  3. HELP OTHER FRONTEND DEVELOPERS: The job market can be tough with 1,000+ applicants per role. A referral gives another developer a genuine shot at an interview. Pay it forward and support your peers.
  4. FAST & SIMPLE: Takes less than 60 seconds to submit a referral on FrontendEngineers.com.
- USE LOTS OF EMOJIS: 🤝❤️🚀🔥💼💡✨ (warm, community-spirited, and uplifting).
- LINKS REQUIRED (format as plain text):
  🤝 Post your referral for free to help fellow developers:
  https://www.frontendengineers.com/referrals
- ENGAGEMENT: "Does your company have an open frontend position? Post your referral link for free on FrontendEngineers.com or tag an engineer who can help!"
- HASHTAGS: 15-25 targeted hashtags (#PayItForward #CommunitySupport #FrontendDeveloper #JobReferrals #TechCommunity #RemoteWork #ReactJS #WebDevelopment #SoftwareEngineering #DevelopersHelpingDevelopers).
- LENGTH: 900 - 1600 characters.

---
CRITICAL RULES FOR ALL THREE POSTS:
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

        // Extract all three posts using delimiters
        const jobMatch = text.match(/===JOB_POST_START===([\s\S]*?)===JOB_POST_END===/);
        const empMatch = text.match(/===EMPLOYER_POST_START===([\s\S]*?)===EMPLOYER_POST_END===/);
        const refMatch = text.match(/===REFERRAL_POST_START===([\s\S]*?)===REFERRAL_POST_END===/);

        let jobPost = jobMatch ? jobMatch[1].trim() : null;
        let employerPost = empMatch ? empMatch[1].trim() : null;
        let referralPost = refMatch ? refMatch[1].trim() : null;

        if (!jobPost || !employerPost || !referralPost) {
          console.warn(`   ⚠️ Delimiters not cleanly matched. Trying fallback extraction...`);
          const parts = text.split(/===+.*POST.*===+/i).filter(p => p.trim().length > 100);
          if (parts.length >= 3) {
            jobPost = parts[0].trim();
            employerPost = parts[1].trim();
            referralPost = parts[2].trim();
          } else {
            continue;
          }
        }

        if (jobPost.length < 300 || employerPost.length < 200 || referralPost.length < 200) {
          console.warn(`   ⚠️ One of the posts was too short. Retrying...`);
          continue;
        }

        return { jobPost, employerPost, referralPost };
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
  console.log('🚀 LinkedIn Combined Auto-Poster (Job + Employer Ad + Community Referrals)');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE - will not publish to LinkedIn\n');

  // 1. Generate all 3 posts in a SINGLE Gemini AI call
  console.log('\n🤖 Generating 3 posts with Gemini AI (single API request)...');
  const { jobPost, employerPost, referralPost } = await generateThreePostsWithGemini();

  console.log('\n📄 [1/3] Remote Jobs & Referrals Post:');
  console.log('─'.repeat(60));
  console.log(sanitizeForLinkedIn(jobPost));
  console.log('─'.repeat(60));
  console.log(`Length: ${jobPost.length} chars`);

  console.log('\n📄 [2/3] Employer Ad Post:');
  console.log('─'.repeat(60));
  console.log(sanitizeForLinkedIn(employerPost));
  console.log('─'.repeat(60));
  console.log(`Length: ${employerPost.length} chars`);

  console.log('\n📄 [3/3] Community Referral Support Post:');
  console.log('─'.repeat(60));
  console.log(sanitizeForLinkedIn(referralPost));
  console.log('─'.repeat(60));
  console.log(`Length: ${referralPost.length} chars`);

  if (DRY_RUN) {
    console.log('\n✅ LinkedIn DRY RUN complete. All 3 posts successfully generated!');
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

  console.log(`\n📤 Publishing 3 posts to ${accounts.length} LinkedIn account(s)...`);

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
        console.log(`\n   [1/3] Posting Candidate Job Post to ${target.type} (${target.urn})...`);
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
        console.log(`   [2/3] Posting Employer Ad to ${target.type} (${target.urn})...`);
        const res2 = await postToLinkedIn(employerPost, target.urn, acc.token);
        console.log(`   ✅ Posted Employer Ad! Post ID: ${res2.postId}`);
        totalPublished++;
      } catch (err) {
        console.error(`   ❌ Failed to post Employer Ad to ${target.type}: ${err.message}`);
      }

      // Safety delay between posts
      console.log('   ⏳ Waiting 15s before posting Community Referrals Post...');
      await new Promise(r => setTimeout(r, 15000));

      // 3. Post Community Referrals Post
      try {
        console.log(`   [3/3] Posting Community Referrals Post to ${target.type} (${target.urn})...`);
        const res3 = await postToLinkedIn(referralPost, target.urn, acc.token);
        console.log(`   ✅ Posted Community Referrals Post! Post ID: ${res3.postId}`);
        totalPublished++;
      } catch (err) {
        console.error(`   ❌ Failed to post Community Referrals Post to ${target.type}: ${err.message}`);
      }
    }
  }

  if (totalPublished > 0) {
    console.log(`\n🎉 Successfully published ${totalPublished} post(s) to LinkedIn!`);
  } else {
    console.error('\n❌ No posts were published successfully.');
    process.exit(1);
  }

  console.log('\n✅ LinkedIn posting complete!');

  if (WITH_TWITTER) {
    console.log('\n🐦 Publishing to Twitter/X as requested (--with-twitter)...');
    try {
      const { postThreeTweetsToTwitter, generateThreeTwitterPostsWithGemini } = require('./post-to-twitter');
      console.log('🤖 Generating 3 Twitter-optimized posts with Gemini AI...');
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
