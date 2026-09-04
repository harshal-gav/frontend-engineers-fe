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

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY');
  process.exit(1);
}

if (!DRY_RUN && (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_ID)) {
  console.error('❌ Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_ID');
  process.exit(1);
}

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

/**
 * Pick the best unposted job to share.
 * Prioritizes: frontend in title > top-tier companies > recent postings
 */
function pickNextJob(jobs, postedIds) {
  const postedSet = new Set(postedIds);
  
  // Filter to unposted, non-dead, remote jobs
  const candidates = jobs.filter(j => 
    !postedSet.has(j.id) &&
    !j.isDead &&
    j.remoteType === 'REMOTE'
  );

  if (candidates.length === 0) return null;

  // Score each candidate
  const scored = candidates.map(job => {
    let score = 0;
    const titleLower = job.title.toLowerCase();
    
    // Strong preference for frontend-titled jobs
    if (titleLower.includes('frontend') || titleLower.includes('front-end')) score += 50;
    if (titleLower.includes('react')) score += 30;
    if (titleLower.includes('vue') || titleLower.includes('angular')) score += 25;
    if (titleLower.includes('typescript')) score += 20;
    if (titleLower.includes('next.js') || titleLower.includes('nextjs')) score += 20;
    
    // Prefer senior / lead roles (more engagement)
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('staff')) score += 15;
    
    // Prefer jobs with salary data (more attractive)
    if (job.salaryMin || job.salaryMax) score += 10;
    
    // Prefer recent postings
    if (job.postedAt) {
      const ageMs = Date.now() - new Date(job.postedAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays <= 3) score += 15;
      else if (ageDays <= 7) score += 10;
      else if (ageDays <= 14) score += 5;
    }
    
    // Prefer jobs with descriptions (richer content for AI)
    if (job.description && job.description.length > 200) score += 10;

    // Prefer known companies with logos
    if (job.company?.logoUrl) score += 5;

    return { job, score };
  });

  // Sort by score descending, add some randomness for variety
  scored.sort((a, b) => {
    // Add jitter of ±10 to prevent always picking the same top job
    const jitter = () => Math.random() * 20 - 10;
    return (b.score + jitter()) - (a.score + jitter());
  });

  return scored[0]?.job || null;
}

// ─── Gemini AI ───────────────────────────────────────────────

async function generatePostWithGemini(job) {
  const jobUrl = `${SITE_URL}/jobs/${generateSlug(job)}`;
  
  // Build a concise context for Gemini
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const descriptionSnippet = job.description 
    ? job.description.substring(0, 1500) 
    : 'No description available.';

  const prompt = `You are a social media manager for FrontendEngineers.com, the premier job board for remote frontend developers. 

Write an engaging LinkedIn post to promote this job listing. The post should feel authentic, helpful, and professional — NOT spammy. Aim for high reach and engagement.

**Job Details:**
- Title: ${job.title}
- Company: ${job.company?.name || 'Company'}
- Industry: ${job.company?.industry || 'Tech'}
- Location: ${job.location || 'Remote'}
- Remote Type: ${job.remoteType}
- Employment: ${job.employmentType}
- Experience Level: ${job.experienceLevel || 'Not specified'}
${salary ? `- Salary: ${salary}` : ''}
- Job URL: ${jobUrl}

**Job Description (excerpt):**
${descriptionSnippet}

**Rules for the post:**
1. Keep it between 150-300 words (LinkedIn sweet spot for engagement)
2. Start with a hook that grabs attention (a question, a bold statement, or an emoji)
3. Highlight 2-3 key selling points of the role (remote work, salary, tech stack, company)
4. Include the job URL as a clear CTA: "Apply here 👉 ${jobUrl}"
5. End with 5-8 relevant hashtags on a new line (e.g., #RemoteJobs #FrontendDeveloper #React #Hiring)
6. Vary your style — sometimes use bullet points, sometimes narrative, sometimes emojis
7. Mention "FrontendEngineers.com" naturally as the source
8. Do NOT use markdown formatting (no bold **, no headers #). LinkedIn doesn't render markdown.
9. Do NOT include any image URLs or [image] placeholders.
10. Make it sound human and conversational, not corporate.

Write ONLY the post text, nothing else.`;

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

function formatSalary(min, max, currency) {
  if (!min && !max) return '';
  const curr = currency || 'USD';
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const sym = symbols[curr] || curr + ' ';

  const fmt = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };

  if (min && max && min !== max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  return `${sym}${fmt(min || max)}`;
}

// ─── LinkedIn API ────────────────────────────────────────────

async function postToLinkedIn(text) {
  const payload = {
    author: `urn:li:person:${LINKEDIN_PERSON_ID}`,
    commentary: text,
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
  console.log('🚀 LinkedIn Auto-Poster');
  console.log('═'.repeat(50));
  if (DRY_RUN) console.log('⚠️  DRY RUN MODE — will not post to LinkedIn\n');

  // 1. Load data
  const jobs = loadJobs();
  const postedIds = loadPostedIds();
  console.log(`📊 Total jobs: ${jobs.length}`);
  console.log(`📝 Already posted: ${postedIds.length}`);

  // 2. Pick a job
  const job = pickNextJob(jobs, postedIds);
  if (!job) {
    console.log('\n✅ All jobs have been posted! Nothing to do.');
    process.exit(0);
  }

  const slug = generateSlug(job);
  console.log(`\n🎯 Selected job:`);
  console.log(`   Title: ${job.title}`);
  console.log(`   Company: ${job.company?.name}`);
  console.log(`   URL: ${SITE_URL}/jobs/${slug}`);

  // 3. Generate post with Gemini
  console.log('\n🤖 Generating post with Gemini AI...');
  const postText = await generatePostWithGemini(job);
  
  console.log('\n📄 Generated post:');
  console.log('─'.repeat(50));
  console.log(postText);
  console.log('─'.repeat(50));

  // 4. Post to LinkedIn
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — Skipping LinkedIn publish');
    console.log(`   Post length: ${postText.length} characters`);
  } else {
    console.log('\n📤 Publishing to LinkedIn...');
    try {
      const result = await postToLinkedIn(postText);
      console.log(`✅ Posted successfully! Post ID: ${result.postId}`);
      
      // 5. Track the posted job
      postedIds.push(job.id);
      savePostedIds(postedIds);
      console.log(`💾 Updated linkedin-posted.json (${postedIds.length} total)`);
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
