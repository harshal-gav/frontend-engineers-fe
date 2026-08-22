const fs = require('fs');
const crypto = require('crypto');

const urls = [
  "https://stripe.com/careers/listing/frontend-engineer-expansion/7644950",
  "https://careers.airbnb.com/positions/8138069/",
  "https://explore.jobs.netflix.net/careers?query=frontend&pid=790317397849&domain=netflix.com&sort_by=relevance&triggerGoButton=false",
  "https://explore.jobs.netflix.net/careers?query=frontend&pid=790317849415&domain=netflix.com&sort_by=relevance&triggerGoButton=false",
  "https://explore.jobs.netflix.net/careers?query=frontend&pid=790317935515&domain=netflix.com&sort_by=relevance&triggerGoButton=false",
  "https://www.shopify.com/careers/software-engineers-frontend_819eb2d1-1bf6-4f0d-91dd-419aea8bd9d5?keyword=front",
  "https://www.shopify.com/careers/senior-frontend-engineer-professional-services_f5cc14a5-3958-4bc5-8ebd-a262e00f737b?keyword=front",
  "https://vercel.com/careers/visual-designer-web-us-6115991004",
  "https://jobs.ashbyhq.com/supabase/f048dd68-63f8-4f98-9860-3d5a43c09a01",
  "https://jobs.ashbyhq.com/supabase/f44742fb-18c6-478f-bf78-63707ed57db7",
  "https://www.github.careers/careers-home/jobs/5695?lang=en-us",
  "https://www.github.careers/careers-home/jobs/5588?lang=en-us",
  "https://www.github.careers/careers-home/jobs/5732?lang=en-us",
  "https://www.github.careers/careers-home/jobs/5731?lang=en-us",
  "https://job-boards.greenhouse.io/gitlab/jobs/8636539002",
  "https://jobs.twilio.com/careers/job/1099551762492?domain=twilio.com&hl=en"
];

function generateId(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function extractMeta(html, property) {
  const regex = new RegExp(`<meta[^>]*?(?:property|name)=["']${property}["'][^>]*?content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  
  // Try reverse order
  const regex2 = new RegExp(`<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "Unknown Title";
}

async function scrapeUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    
    let title = extractMeta(html, 'og:title') || extractTitle(html);
    let description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || "";
    
    // Determine company
    let companyName = "Unknown";
    if (url.includes('stripe')) companyName = "Stripe";
    else if (url.includes('airbnb')) companyName = "Airbnb";
    else if (url.includes('netflix')) companyName = "Netflix";
    else if (url.includes('shopify')) companyName = "Shopify";
    else if (url.includes('vercel')) companyName = "Vercel";
    else if (url.includes('supabase')) companyName = "Supabase";
    else if (url.includes('github')) companyName = "GitHub";
    else if (url.includes('gitlab')) companyName = "GitLab";
    else if (url.includes('twilio')) companyName = "Twilio";
    
    title = title.replace(/\|.*$/, '').trim(); // Remove suffix like "| Stripe"

    return {
      id: generateId(url),
      title: title,
      applyUrl: url,
      description: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
      location: "Remote", // Defaulting to remote as per instructions
      city: "",
      state: "",
      country: "",
      remoteType: "REMOTE",
      salaryMin: null,
      salaryMax: null,
      currency: "USD",
      experienceLevel: title.toLowerCase().includes('senior') ? 'SENIOR' : (title.toLowerCase().includes('staff') ? 'STAFF' : 'MID'),
      employmentType: "FULL_TIME",
      department: "Engineering",
      postedAt: new Date().toISOString(),
      sourceHash: generateId(url),
      company: {
        id: companyName.toLowerCase(),
        name: companyName,
        logoUrl: null,
        industry: "Technology",
        website: `https://${companyName.toLowerCase()}.com`
      }
    };
  } catch (e) {
    console.error(`Failed to scrape ${url}:`, e.message);
    return null;
  }
}

async function run() {
  const jobs = [];
  for (const url of urls) {
    console.log(`Scraping ${url}...`);
    const job = await scrapeUrl(url);
    if (job) jobs.push(job);
  }
  
  fs.writeFileSync('./data/jobs.json', JSON.stringify(jobs, null, 2));
  console.log(`Saved ${jobs.length} jobs to data/jobs.json`);
}

run();
