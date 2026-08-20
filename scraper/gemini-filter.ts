/**
 * Gemini AI Job Filter
 * 
 * Uses Google Gemini API to classify whether scraped jobs are truly
 * frontend/JavaScript/TypeScript focused roles.
 * 
 * Only approves:
 * - Frontend developer/engineer roles
 * - React, Vue, Angular, Next.js, Svelte roles
 * - UI/UX engineer roles (code-focused)
 * - Full-stack roles IF they are JavaScript/TypeScript based
 * - TypeScript/JavaScript developer roles
 * 
 * Rejects:
 * - Backend roles in Python, Java, Go, Rust, C++, etc.
 * - DevOps, Infrastructure, Platform, Data, ML/AI engineer roles
 * - Mobile (Swift, Kotlin) unless React Native
 * - Generic "Software Engineer" with no JS/TS indicators
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface JobForFilter {
  index: number;
  title: string;
  description: string;
  department?: string;
}

interface FilterResult {
  index: number;
  approved: boolean;
  reason: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class GeminiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

/**
 * Send a batch of jobs to Gemini for classification.
 * Returns which jobs are approved (true frontend/JS/TS roles).
 */
async function classifyBatch(
  apiKey: string,
  jobs: JobForFilter[],
  retryCount = 0
): Promise<FilterResult[]> {
  const jobList = jobs.map(j => 
    `[${j.index}] Title: "${j.title}" | Department: "${j.department || 'N/A'}" | Description: "${j.description?.substring(0, 300) || 'N/A'}"`
  ).join('\n');

  const prompt = `You are a strict job classifier for a remote frontend developer job board called FrontendEngineers.com.

Your task: For each job below, decide if it belongs on our board. Reply ONLY with a JSON array.

APPROVE a job ONLY if ALL of these are true:
1. It is a coding/engineering role (not design-only, not product management, not marketing)
2. It primarily involves JavaScript or TypeScript
3. It falls into one of these categories:
   - Frontend Engineer/Developer (React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, Astro)
   - UI Engineer / UI Developer (building interfaces with JS/TS)
   - Full-Stack Engineer/Developer BUT only if the stack is JavaScript/TypeScript based (Node.js, Express, Nest.js + React/Vue/Angular)
   - React Native or Expo mobile developer (since it's JavaScript)
   - Web Developer focused on JavaScript frameworks
   - TypeScript Developer
   - JavaScript Developer
4. The role must be FULLY REMOTE and explicitly open to candidates in the USA, Canada, OR Europe.

REJECT a job if ANY of these are true:
- It's a backend role in Python, Java, Go, Rust, C#, C++, Ruby, PHP, Scala, Elixir, or Kotlin
- It's DevOps, SRE, Infrastructure, Platform, Cloud, or Systems engineering
- It's Data Engineering, Data Science, ML/AI, or Analytics
- It's iOS (Swift) or Android (Kotlin/Java) native development
- It's a QA/Testing role (unless it's specifically frontend testing)
- It's Product Management, Design (non-coding), Marketing, Sales, or HR
- It's a generic "Software Engineer" with no clear JS/TS/frontend indicators
- It's Security Engineering, Database Administration, or Networking
- The title mentions Python, Java, Go, Rust, C++, Ruby, PHP, .NET, or similar non-JS languages
- The job requires the candidate to be onsite/hybrid, or only hires from outside USA/Canada/Europe (e.g. "Asia only", "Latin America only").

Jobs to classify:
${jobList}

Reply with ONLY a valid JSON array, no markdown, no explanation:
[{"index": 0, "approved": true, "reason": "React frontend role"}]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Rate limit or Quota exceeded
      if (response.status === 429) {
        throw new GeminiRateLimitError(`Gemini API rate limit or quota exceeded (429). Stop execution.`);
      }
      
      throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let results: FilterResult[] = [];
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      results = JSON.parse(cleaned);
    } catch (parseErr) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          results = JSON.parse(match[0]);
        } catch (e2) {
          throw new Error(`JSON parse failed: ${parseErr}. Text: ${text.substring(0, 100)}...`);
        }
      } else {
        throw new Error(`No JSON array found. Text: ${text.substring(0, 100)}...`);
      }
    }
    
    return results;
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      throw error; // Bubble up the rate limit error
    }

    if (retryCount < 2) {
      console.log(`   ⚠️ Gemini error, retrying... (${error instanceof Error ? error.message : error})`);
      await sleep(2000);
      return classifyBatch(apiKey, jobs, retryCount + 1);
    }
    
    console.error(`   ❌ Gemini classification failed after retries:`, error);
    return jobs.map(j => ({ index: j.index, approved: false, reason: 'Classification failed' }));
  }
}

/**
 * Filter an array of jobs using Gemini AI.
 * Processes in batches of 15 to stay within token limits.
 * Returns indices of approved jobs.
 */
export async function filterJobsWithGemini(
  apiKey: string,
  jobs: { title: string; description?: string; department?: string }[],
  onProgress?: (msg: string) => void
): Promise<{ approvedIndices: Set<number>; results: FilterResult[]; hitRateLimit: boolean }> {
  const log = onProgress || console.log;
  const BATCH_SIZE = 15;
  const allResults: FilterResult[] = [];
  let hitRateLimit = false;
  
  log(`   🤖 Gemini AI: Classifying ${jobs.length} jobs...`);
  
  // Prepare jobs for classification
  const jobsForFilter: JobForFilter[] = jobs.map((j, i) => ({
    index: i,
    title: j.title,
    description: j.description || '',
    department: j.department,
  }));
  
  // Process in batches
  for (let i = 0; i < jobsForFilter.length; i += BATCH_SIZE) {
    const batch = jobsForFilter.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(jobsForFilter.length / BATCH_SIZE);
    
    log(`   🤖 Batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);
    
    try {
      const results = await classifyBatch(apiKey, batch);
      allResults.push(...results);
    } catch (err) {
      if (err instanceof GeminiRateLimitError) {
        log(`   ❌ Hit Gemini rate limit/quota. Stopping further classification.`);
        hitRateLimit = true;
        break; // Stop processing further batches, but keep allResults from previous batches
      } else {
        throw err;
      }
    }
    
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < jobsForFilter.length) {
      await sleep(1000);
    }
  }
  
  const approvedIndices = new Set<number>();
  let approvedCount = 0;
  let rejectedCount = 0;
  
  for (const result of allResults) {
    if (result.approved) {
      approvedIndices.add(result.index);
      approvedCount++;
    } else {
      rejectedCount++;
    }
  }
  
  log(`   ✅ Gemini AI: ${approvedCount} approved, ${rejectedCount} rejected`);
  
  // Log some rejected examples for debugging
  const rejectedExamples = allResults
    .filter(r => !r.approved)
    .slice(0, 5);
  
  if (rejectedExamples.length > 0) {
    log(`   📋 Sample rejections:`);
    for (const r of rejectedExamples) {
      const job = jobs[r.index];
      log(`      ❌ "${job?.title}" — ${r.reason}`);
    }
  }
  
  return { approvedIndices, results: allResults, hitRateLimit };
}
