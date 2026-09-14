const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const JOBS_FILE = path.join(__dirname, '..', 'data', 'jobs.json');
const LINKEDIN_FILE = path.join(__dirname, '..', 'data', 'linkedin-jobs.json');

// Strict frontend keyword filtering based on user request
function isFrontendJob(title) {
  return /front\s*end/i.test(title);
}

function generateId(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function extractSeniority(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('senior') || lowerTitle.includes('sr') || lowerTitle.includes('staff') || lowerTitle.includes('principal')) {
    return 'SENIOR';
  }
  if (lowerTitle.includes('lead') || lowerTitle.includes('head') || lowerTitle.includes('manager')) {
    return 'LEAD';
  }
  if (lowerTitle.includes('junior') || lowerTitle.includes('jr') || lowerTitle.includes('associate')) {
    return 'JUNIOR';
  }
  return 'MID';
}

function main() {
  if (!fs.existsSync(LINKEDIN_FILE)) {
    console.log('No linkedin-jobs.json found.');
    return;
  }

  const linkedinJobs = JSON.parse(fs.readFileSync(LINKEDIN_FILE, 'utf-8'));
  let existingJobs = [];
  if (fs.existsSync(JOBS_FILE)) {
    existingJobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
  }

  // Deduplication set based on sourceHash or applyUrl
  const existingApplyUrls = new Set(existingJobs.map(j => j.applyUrl));
  const existingHashes = new Set(existingJobs.map(j => j.sourceHash));

  let addedCount = 0;
  let skippedDupCount = 0;

  for (const lJob of linkedinJobs) {
    // Strictly filter by frontend
    if (!isFrontendJob(lJob.title)) {
      continue;
    }
    // Clean URL
    const applyUrl = lJob.applyUrl || lJob.linkedinUrl;
    const sourceHash = generateId(applyUrl);

    if (existingApplyUrls.has(applyUrl) || existingHashes.has(sourceHash)) {
      skippedDupCount++;
      continue;
    }

    const companyDomain = lJob.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

    const newJob = {
      id: generateId(lJob.title + lJob.company + Date.now().toString()),
      title: lJob.title,
      applyUrl: applyUrl,
      description: "Discover this role and apply directly on the company's career page.", // We didn't scrape full description
      location: lJob.location || 'Remote - Global',
      remoteType: 'REMOTE',
      postedAt: new Date(lJob.scrapedAt).toISOString(),
      sourceHash: sourceHash,
      company: {
        id: generateId(lJob.company).substring(0, 10),
        name: lJob.company,
        logoUrl: `https://logo.clearbit.com/${companyDomain}`,
        industry: 'Technology',
        website: `https://${companyDomain}`
      }
    };

    existingJobs.unshift(newJob); // Add to the top
    existingApplyUrls.add(applyUrl);
    existingHashes.add(sourceHash);
    addedCount++;
  }

  fs.writeFileSync(JOBS_FILE, JSON.stringify(existingJobs, null, 2));
  console.log('✅ Merge Complete!');
  console.log(`   Added: ${addedCount} jobs`);
  console.log(`   Skipped (Duplicates): ${skippedDupCount}`);
  console.log(`   Total Jobs now: ${existingJobs.length}`);
}

main();
