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



function run() {
  const jobsPath = path.join(__dirname, '..', 'data', 'jobs.json');
  let jobs = [];
  if (fs.existsSync(jobsPath)) {
    jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  }

  // 1. Enrich existing jobs
  jobs = jobs.map(job => {

    
    // Add Logo
    const domain = getDomain(job.company.name);
    job.company.logoUrl = `https://logo.clearbit.com/${domain}`;
    
    // Refine location
    if (job.location === "Remote" || job.location === "") {
      job.location = "Remote - Global"; // Or "Remote - US" based on company
    }
    return job;
  });



  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  console.log(`Successfully enriched data. Total jobs: ${jobs.length}`);
}

run();
