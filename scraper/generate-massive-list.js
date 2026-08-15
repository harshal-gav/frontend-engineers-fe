const fs = require('fs');
const path = require('path');

const greenhouseCompanies = [
  // Large & Big Tech
  'airbnb', 'lyft', 'doordash', 'instacart', 'pinterest', 'stripe', 'plaid', 'brex',
  'twilio', 'sendgrid', 'okta', 'box', 'dropbox', 'asana', 'slack', 'discord', 'reddit',
  'coinbase', 'gemini', 'kraken', 'robinhood', 'affirm', 'chime', 'sofi',
  
  // DevTools & Cloud
  'github', 'gitlab', 'hashicorp', 'databricks', 'snowflake', 'confluent', 'mongodb', 
  'elastic', 'fastly', 'cloudflare', 'digitalocean', 'heroku', 'vercel', 'netlify',
  'flyio', 'render', 'supabase', 'planetscale', 'neon', 'auth0',
  
  // SaaS & Enterprise
  'hubspot', 'zendesk', 'intercom', 'front', 'gong', 'outreach', 'zoom', 'canva',
  'figma', 'miro', 'mural', 'notion', 'coda', 'airtable', 'smartsheet', 'monday',
  
  // YC & Startups
  'retool', 'ramp', 'rippling', 'gusto', 'deel', 'remote', 'papayaglobal', 'oyster',
  'webflow', 'framer', 'zapier', 'typeform', 'calendly', 'loom', 'pitch',
  
  // Media / Consumer / Other
  'peloton', 'spotify', 'epicgames', 'roblox', 'unity', 'patreon', 'kickstarter',
  'indiegogo', 'eventbrite', 'ticketmaster', 'zillow', 'redfin', 'compass',
  'doctolib', 'babylonhealth', 'oscar', 'color', '23andme', 'calm', 'headspace',
  'coursera', 'udacity', 'masterclass', 'duolingo', 'quizlet', 'outschool',
  
  // Random / Extras
  'postman', 'sentry', 'datadog', 'newrelic', 'appdynamics', 'splunk', 'crowdstrike',
  'paloaltonetworks', 'fortinet', 'zscaler', 'cloudflare', 'akamai', 'f5', 'cisco',
  'juniper', 'arista', 'vmware', 'nutanix', 'purestorage', 'netapp', 'rubrik'
];

const leverCompanies = [
  'netflix', 'spotify', 'yelp', 'kiva', 'khanacademy', 'lever', 'grubhub',
  'seamless', 'postmates', 'ubereats', 'deliveryhero', 'wolt', 'glovo',
  'roblox', 'twitch', 'vimeo', 'dailymotion', 'hulu', 'roku', 'fubo',
  'tubi', 'pluto', 'crunchyroll', 'funimation', 'viki', 'rakuten', 'mercari',
  'poshmark', 'depop', 'thredup', 'realreal', 'stockx', 'goat', 'grailed',
  'canva', 'invision', 'sketch', 'zeplin', 'marvel', 'balsamiq', 'axure',
  'optimizely', 'vwo', 'crazyegg', 'hotjar', 'fullstory', 'logrocket', 'sentry',
  'bugsnag', 'rollbar', 'raygun', 'datadog', 'dynatrace', 'appdynamics', 'newrelic'
];

// Deduplicate just in case
const uniqueGreenhouse = [...new Set(greenhouseCompanies)];
const uniqueLever = [...new Set(leverCompanies)];

const dir = path.join(process.cwd(), 'scraper', 'configs');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function getTitleCase(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

// Generate Greenhouse
uniqueGreenhouse.forEach(slug => {
  const config = {
    company: getTitleCase(slug),
    slug: slug,
    careersUrl: `https://boards.greenhouse.io/${slug}`,
    website: `https://${slug}.com`,
    industry: "Technology",
    atsType: "greenhouse",
    boardUrl: `https://boards.greenhouse.io/${slug}`,
    selectors: {
      jobList: ".opening",
      jobTitle: "a",
      jobLocation: ".location",
      jobDepartment: ".department",
      jobLink: "a"
    },
    pagination: { type: "none" },
    crawlIntervalHours: 24,
    respectRobotsTxt: true
  };
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(config, null, 2));
});

// Generate Lever
uniqueLever.forEach(slug => {
  const config = {
    company: getTitleCase(slug),
    slug: slug,
    careersUrl: `https://jobs.lever.co/${slug}`,
    website: `https://${slug}.com`,
    industry: "Technology",
    atsType: "lever",
    boardUrl: `https://jobs.lever.co/${slug}`,
    selectors: {
      jobList: ".posting",
      jobTitle: ".posting-title h5",
      jobLocation: ".sort-by-location",
      jobDepartment: ".sort-by-team",
      jobLink: "a.posting-title"
    },
    pagination: { type: "none" },
    crawlIntervalHours: 24,
    respectRobotsTxt: true
  };
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(config, null, 2));
});

console.log(`Successfully generated ${uniqueGreenhouse.length} Greenhouse configs and ${uniqueLever.length} Lever configs.`);
console.log(`Total companies: ${uniqueGreenhouse.length + uniqueLever.length}`);
