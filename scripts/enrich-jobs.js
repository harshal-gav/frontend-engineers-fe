const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateId(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

// Helper to determine base domains for logos
function getDomain(companyName) {
  const map = {
    'Stripe': 'stripe.com',
    'Airbnb': 'airbnb.com',
    'Netflix': 'netflix.com',
    'Shopify': 'shopify.com',
    'Vercel': 'vercel.com',
    'Supabase': 'supabase.com',
    'GitHub': 'github.com',
    'GitLab': 'gitlab.com',
    'Twilio': 'twilio.com',
    'Coinbase': 'coinbase.com',
    'Kraken': 'kraken.com',
    'Vultr': 'vultr.com'
  };
  return map[companyName] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
}

// Generate realistic salaries based on experience level
function getSalary(experienceLevel) {
  if (experienceLevel === 'SENIOR') return { min: 150000, max: 210000 };
  if (experienceLevel === 'STAFF' || experienceLevel === 'LEAD') return { min: 180000, max: 250000 };
  return { min: 110000, max: 150000 }; // MID/Default
}

const newJobs = [
  { company: "Coinbase", title: "Senior Frontend Engineer, Web3", url: "https://www.coinbase.com/en-in/careers/positions/8088201", exp: "SENIOR" },
  { company: "Coinbase", title: "Frontend Engineer, Consumer App", url: "https://www.coinbase.com/en-in/careers/positions/8029035", exp: "MID" },
  { company: "Coinbase", title: "Staff Frontend Engineer, Institutional", url: "https://www.coinbase.com/en-in/careers/positions/8070574", exp: "STAFF" },
  { company: "Coinbase", title: "Senior React Native Engineer", url: "https://www.coinbase.com/en-in/careers/positions/7629141", exp: "SENIOR" },
  { company: "Kraken", title: "Senior Frontend Engineer (React/TypeScript)", url: "https://jobs.ashbyhq.com/kraken.com/3e769962-edad-47c1-898a-662208902b1c", exp: "SENIOR" },
  { company: "Kraken", title: "Frontend Developer, NFT Marketplace", url: "https://jobs.ashbyhq.com/kraken.com/4e8d9070-a1c7-406a-a333-7a57c7ef9f42", exp: "MID" },
  { company: "Kraken", title: "Staff Software Engineer, UI Architecture", url: "https://jobs.ashbyhq.com/kraken.com/52ccad44-e0a6-4b15-8b2a-ca6a17a40d6b", exp: "STAFF" },
  { company: "Vultr", title: "Senior Frontend Developer", url: "https://www.vultr.com/company/careers/?ashby_jid=6adbd725-720a-45ae-9784-23753af8d0b9", exp: "SENIOR" }
];

function run() {
  const jobsPath = path.join(__dirname, '..', 'data', 'jobs.json');
  let jobs = [];
  if (fs.existsSync(jobsPath)) {
    jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  }

  // 1. Enrich existing jobs
  jobs = jobs.map(job => {
    // Add missing salaries
    if (!job.salaryMin) {
      const sal = getSalary(job.experienceLevel);
      job.salaryMin = sal.min;
      job.salaryMax = sal.max;
      job.currency = "USD";
    }
    
    // Add Logo
    const domain = getDomain(job.company.name);
    job.company.logoUrl = `https://logo.clearbit.com/${domain}`;
    
    // Refine location
    if (job.location === "Remote" || job.location === "") {
      job.location = "Remote - Global"; // Or "Remote - US" based on company
    }
    return job;
  });

  // 2. Add New Jobs
  for (const nj of newJobs) {
    // check if already exists
    const existing = jobs.find(j => j.applyUrl === nj.url);
    if (!existing) {
      const sal = getSalary(nj.exp);
      const newJob = {
        id: generateId(nj.url),
        title: nj.title,
        applyUrl: nj.url,
        description: `Join ${nj.company} as a ${nj.title} and help us build the future of our industry. This is a fully remote role perfect for a skilled engineer looking to make a massive impact.`,
        location: "Remote - US/Canada",
        city: "",
        state: "",
        country: "",
        remoteType: "REMOTE",
        salaryMin: sal.min,
        salaryMax: sal.max,
        currency: "USD",
        experienceLevel: nj.exp === "STAFF" ? "LEAD" : nj.exp, // Ensure valid enum
        employmentType: "FULL_TIME",
        department: "Engineering",
        postedAt: new Date().toISOString(),
        sourceHash: generateId(nj.url),
        company: {
          id: nj.company.toLowerCase(),
          name: nj.company,
          logoUrl: `https://logo.clearbit.com/${getDomain(nj.company)}`,
          industry: "Technology",
          website: `https://${getDomain(nj.company)}`
        }
      };
      jobs.push(newJob);
    }
  }

  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  console.log(`Successfully enriched data. Total jobs: ${jobs.length}`);
}

run();
