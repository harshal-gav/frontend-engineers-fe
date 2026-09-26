#!/usr/bin/env node
/**
 * AI Job Enrichment Script with Rule-Based Fallback
 * 
 * Reads all jobs from data/jobs.json, sends each description to Gemini AI
 * to extract structured metadata (stack, remote scope, seniority, employment type).
 * If the API fails (e.g. rate limit), falls back to regex rule-based extraction.
 * 
 * ONLY processes jobs that don't already have `aiTags`.
 * Ideal for running in GitHub Actions right after scraping new jobs.
 * 
 * Usage:
 *   node scripts/enrich-jobs-ai.js
 *   node scripts/enrich-jobs-ai.js --force   # Re-enrich all jobs (WARNING: uses API quota)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JOBS_PATH = path.join(__dirname, '..', 'data', 'jobs.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FORCE = process.argv.includes('--force');

// Sequential processing to avoid rate limits
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const MAX_RETRIES = 2; // Reduced retries so it fails over to regex faster

const PROMPT_TEMPLATE = `You are a job data analyst. Analyze this frontend developer job posting and extract structured metadata.

JOB TITLE: {TITLE}
COMPANY: {COMPANY}
LOCATION: {LOCATION}
REMOTE TYPE: {REMOTE_TYPE}
COUNTRY: {COUNTRY}

JOB DESCRIPTION:
{DESCRIPTION}

---

You MUST respond with ONLY valid JSON (no markdown, no backticks, no explanation). Use this exact schema:

{
  "stack": ["react", "typescript"],
  "remoteScope": "GLOBAL",
  "eligibleRegions": ["Global"],
  "seniority": "senior",
  "employmentType": "fulltime"
}

RULES:
1. "stack" — Array of frontend technologies/frameworks mentioned or implied. Use ONLY these lowercase values:
   react, vue, angular, nextjs, nuxtjs, svelte, sveltekit, typescript, javascript, css, tailwind, sass, less, webpack, vite, redux, mobx, zustand, graphql, storybook, figma, cypress, jest, playwright, flutter, blazor, ember, backbone, jquery, html, accessibility, webgl, threejs, d3, gatsby, remix, astro

2. "remoteScope" — One of:
   - "GLOBAL" — Truly worldwide remote, no country restriction mentioned
   - "REGION" — Restricted to a region like LATAM, EMEA, Europe, Asia, Americas
   - "COUNTRY" — Restricted to a specific country or requires work authorization in that country (e.g., "must be authorized to work in the US")
   If the job says "Remote" with no restrictions, use "GLOBAL".
   If the location says "Remote - United States" or mentions US work authorization, use "COUNTRY".

3. "eligibleRegions" — Array of specific countries or regions. Examples:
   - ["Global"] for worldwide
   - ["United States"] or ["United States", "Canada"] for country-specific
   - ["LATAM"] or ["Europe", "EMEA"] for region-specific
   Use the country field and location field as strong signals.

4. "seniority" — One of: "junior", "mid", "senior", "lead", "principal", "manager"
   - If title says "Junior" or requires 0-2 years → "junior"
   - If title says "Senior" or requires 5+ years → "senior"
   - If title says "Lead", "Staff", or "Tech Lead" → "lead"
   - If title says "Principal", "Architect", or "Distinguished" → "principal"
   - If title says "Manager", "Director", "Head of", "VP" → "manager"
   - Default to "mid" if unclear

5. "employmentType" — One of: "fulltime", "contract", "parttime", "b2b", "internship"
   - Look for keywords: "full-time", "contract", "freelance", "part-time", "B2B", "intern"
   - If hourly rate or "hours/week" mentioned with < 30 hours → "parttime"
   - If hourly rate with 40 hours or "contract" → "contract"
   - Default to "fulltime" if unclear

Respond with ONLY the JSON object. No extra text.`;

// ─── Rule-Based Fallback Logic ─────────────────────────────────────

const STACK_PATTERNS = [
  { tag: 'react', patterns: [/\breact(?:\.?js)?\b/i, /\breactjs\b/i] },
  { tag: 'vue', patterns: [/\bvue(?:\.?js)?\b/i, /\bvuejs\b/i] },
  { tag: 'angular', patterns: [/\bangular(?:js)?\b/i] },
  { tag: 'nextjs', patterns: [/\bnext\.?js\b/i, /\bnext\.js\b/i] },
  { tag: 'nuxtjs', patterns: [/\bnuxt(?:\.?js)?\b/i] },
  { tag: 'svelte', patterns: [/\bsvelte(?:kit)?\b/i] },
  { tag: 'sveltekit', patterns: [/\bsveltekit\b/i] },
  { tag: 'typescript', patterns: [/\btypescript\b/i, /\bTS\b/] },
  { tag: 'javascript', patterns: [/\bjavascript\b/i, /\bJS\b/, /\bES6\b/i, /\bES2015\b/i, /\becmascript\b/i] },
  { tag: 'css', patterns: [/\bCSS(?:3)?\b/i] },
  { tag: 'tailwind', patterns: [/\btailwind(?:\s?css)?\b/i] },
  { tag: 'sass', patterns: [/\bsass\b/i, /\bscss\b/i] },
  { tag: 'less', patterns: [/\bless\b/i] },
  { tag: 'webpack', patterns: [/\bwebpack\b/i] },
  { tag: 'vite', patterns: [/\bvite\b/i] },
  { tag: 'redux', patterns: [/\bredux\b/i] },
  { tag: 'mobx', patterns: [/\bmobx\b/i] },
  { tag: 'zustand', patterns: [/\bzustand\b/i] },
  { tag: 'graphql', patterns: [/\bgraphql\b/i, /\bgraph\s?ql\b/i] },
  { tag: 'storybook', patterns: [/\bstorybook\b/i] },
  { tag: 'figma', patterns: [/\bfigma\b/i] },
  { tag: 'cypress', patterns: [/\bcypress\b/i] },
  { tag: 'jest', patterns: [/\bjest\b/i] },
  { tag: 'playwright', patterns: [/\bplaywright\b/i] },
  { tag: 'flutter', patterns: [/\bflutter\b/i] },
  { tag: 'blazor', patterns: [/\bblazor\b/i] },
  { tag: 'ember', patterns: [/\bember(?:\.?js)?\b/i] },
  { tag: 'jquery', patterns: [/\bjquery\b/i] },
  { tag: 'html', patterns: [/\bhtml(?:5)?\b/i] },
  { tag: 'accessibility', patterns: [/\baccessibility\b/i, /\bWCAG\b/i, /\ba11y\b/i, /\baria\b/i] },
  { tag: 'webgl', patterns: [/\bwebgl\b/i] },
  { tag: 'threejs', patterns: [/\bthree\.?js\b/i] },
  { tag: 'd3', patterns: [/\bd3(?:\.js)?\b/i] },
  { tag: 'gatsby', patterns: [/\bgatsby\b/i] },
  { tag: 'remix', patterns: [/\bremix\b/i] },
  { tag: 'astro', patterns: [/\bastro\b/i] },
];

function fallbackExtractTags(job) {
  const text = `${job.title || ''} ${job.description || ''}`;
  
  // 1. Stack
  const stackSet = new Set();
  for (const { tag, patterns } of STACK_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        stackSet.add(tag);
        break;
      }
    }
  }
  
  // 2. Remote Scope
  const locText = `${job.location || ''} ${job.country || ''} ${job.description || ''}`;
  let remoteScope = 'GLOBAL';
  let eligibleRegions = ['Global'];
  
  if (/\bauthori[sz]ed\s+to\s+work\b/i.test(locText) || /\bno\s+visa\s+sponsorship\b/i.test(locText) || /\bmust\s+be\s+a\s+US\b/i.test(locText)) {
    remoteScope = 'COUNTRY';
    eligibleRegions = [job.country || 'United States'];
  } else if (job.location && job.location.includes('Remote - ')) {
    const loc = job.location.replace('Remote - ', '').trim();
    if (loc !== 'Global' && loc !== 'Anywhere') {
      remoteScope = 'COUNTRY';
      eligibleRegions = [loc];
    }
  } else if (/\blatam\b|\beurope\b|\bemea\b/i.test(locText)) {
    remoteScope = 'REGION';
    eligibleRegions = locText.match(/\blatam\b/i) ? ['LATAM'] : ['Europe'];
  }
  
  // 3. Seniority
  let seniority = 'mid';
  const titleLower = (job.title || '').toLowerCase();
  if (/\b(?:junior|jr\.?|entry)\b/i.test(titleLower)) seniority = 'junior';
  else if (/\b(?:principal|architect|staff)\b/i.test(titleLower)) seniority = 'principal';
  else if (/\b(?:lead|manager|head)\b/i.test(titleLower)) seniority = 'lead';
  else if (/\b(?:senior|sr\.?)\b/i.test(titleLower)) seniority = 'senior';
  else {
    const yearsMatch = text.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years <= 2) seniority = 'junior';
      else if (years >= 5) seniority = 'senior';
    }
  }
  
  // 4. Employment Type
  let employmentType = 'fulltime';
  if (/\b(?:intern|internship)\b/i.test(text)) employmentType = 'internship';
  else if (/\bb2b\b/i.test(text)) employmentType = 'b2b';
  else if (/\b(?:contract|freelance|1099)\b/i.test(text)) employmentType = 'contract';
  else if (/\bpart[\s-]?time\b/i.test(text)) employmentType = 'parttime';

  return {
    stack: Array.from(stackSet),
    remoteScope,
    eligibleRegions,
    seniority,
    employmentType
  };
}

// ─── AI API Logic ──────────────────────────────────────────

async function callGemini(prompt, attempt = 1) {
  if (!GEMINI_API_KEY) throw new Error('No API key provided');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    }
  );

  if (!res.ok) {
    if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
      const waitSec = attempt * 5;
      console.log(`   ⚠️  Rate limited (${res.status}), retrying API in ${waitSec}s...`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      return callGemini(prompt, attempt + 1);
    }
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  let cleaned = text.trim();
  if (cleaned.includes('\`\`\`')) {
    const jsonMatch = cleaned.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();
  }
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return JSON.parse(cleaned);
}

function buildPrompt(job) {
  return PROMPT_TEMPLATE
    .replace('{TITLE}', job.title || '')
    .replace('{COMPANY}', job.company?.name || '')
    .replace('{LOCATION}', job.location || '')
    .replace('{REMOTE_TYPE}', job.remoteType || '')
    .replace('{COUNTRY}', job.country || '')
    .replace('{DESCRIPTION}', (job.description || '').substring(0, 3000));
}

const VALID_STACK = new Set([
  'react', 'vue', 'angular', 'nextjs', 'nuxtjs', 'svelte', 'sveltekit',
  'typescript', 'javascript', 'css', 'tailwind', 'sass', 'less',
  'webpack', 'vite', 'redux', 'mobx', 'zustand', 'graphql',
  'storybook', 'figma', 'cypress', 'jest', 'playwright',
  'flutter', 'blazor', 'ember', 'backbone', 'jquery', 'html',
  'accessibility', 'webgl', 'threejs', 'd3', 'gatsby', 'remix', 'astro'
]);
const VALID_REMOTE_SCOPE = new Set(['GLOBAL', 'REGION', 'COUNTRY']);
const VALID_SENIORITY = new Set(['junior', 'mid', 'senior', 'lead', 'principal', 'manager']);
const VALID_EMPLOYMENT = new Set(['fulltime', 'contract', 'parttime', 'b2b', 'internship']);

function sanitizeAiTags(raw) {
  return {
    stack: Array.isArray(raw.stack) ? raw.stack.filter(s => VALID_STACK.has(s)) : [],
    remoteScope: VALID_REMOTE_SCOPE.has(raw.remoteScope) ? raw.remoteScope : 'GLOBAL',
    eligibleRegions: Array.isArray(raw.eligibleRegions) ? raw.eligibleRegions : ['Global'],
    seniority: VALID_SENIORITY.has(raw.seniority) ? raw.seniority : 'mid',
    employmentType: VALID_EMPLOYMENT.has(raw.employmentType) ? raw.employmentType : 'fulltime',
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 AI Job Enrichment Script (with Rule-Based Fallback)');
  console.log('─'.repeat(50));

  const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
  console.log(`📋 Total jobs: ${jobs.length}`);

  const toEnrich = FORCE ? jobs : jobs.filter(j => !j.aiTags);
  console.log(`🔍 Jobs to enrich: ${toEnrich.length} (${FORCE ? 'forced re-enrichment' : 'skipping already enriched'})`);
  
  if (toEnrich.length === 0) {
    console.log('✅ All jobs already enriched! Use --force to re-enrich.');
    return;
  }

  let aiEnrichedCount = 0;
  let fallbackCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEnrich.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (jobs ${i + 1}-${Math.min(i + BATCH_SIZE, toEnrich.length)})`);

    for (const job of batch) {
      const targetJob = jobs.find(j => j.id === job.id);
      if (!targetJob) continue;

      let tags = null;
      let usedFallback = false;

      try {
        if (!GEMINI_API_KEY) {
          throw new Error("No GEMINI_API_KEY available.");
        }
        const prompt = buildPrompt(targetJob);
        const rawTags = await callGemini(prompt);
        tags = sanitizeAiTags(rawTags);
      } catch (err) {
        console.log(`   ⚠️  AI failed (${err.message.substring(0, 60)}...). Falling back to Rule-Based parsing.`);
        tags = fallbackExtractTags(targetJob);
        usedFallback = true;
      }

      targetJob.aiTags = tags;
      
      if (usedFallback) {
        fallbackCount++;
        console.log(`   ⚙️  [REGEX] ${targetJob.title.substring(0, 45)} → [${tags.stack.slice(0, 3).join(', ')}] ${tags.remoteScope} ${tags.seniority}`);
      } else {
        aiEnrichedCount++;
        console.log(`   🤖 [AI] ${targetJob.title.substring(0, 45)} → [${tags.stack.slice(0, 3).join(', ')}] ${tags.remoteScope} ${tags.seniority}`);
      }
    }

    // Save progress after every batch
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2) + '\n');

    if (i + BATCH_SIZE < toEnrich.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Done! Enriched ${aiEnrichedCount + fallbackCount} jobs in ${elapsedSec}s`);
  console.log(`   🤖 By AI: ${aiEnrichedCount}`);
  console.log(`   ⚙️  By Regex Fallback: ${fallbackCount}`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
