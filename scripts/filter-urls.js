const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/career_urls.json', 'utf8'));

// Curated list of tech companies highly known for Remote Frontend roles (DevTools, SaaS, Fintech, Web3)
const remoteFriendly = new Set([
  'Stripe', 'Airbnb', 'Netflix', 'Shopify', 'Vercel', 'Supabase', 'Linear', 'Notion', 
  'Figma', 'Canva', 'Slack', 'Discord', 'GitHub', 'GitLab', 'Atlassian', 'Twilio', 
  'SendGrid', 'Plaid', 'Coinbase', 'Kraken', 'Gemini', 'Snowflake', 'Vultr', 'Spotify', 
  'Pinterest', 'Reddit', 'Dropbox', 'Asana', 'Box', 'Zoom', 'Miro', 'Airtable', 
  'HubSpot', 'Zapier', 'Netlify', 'Contentful', 'Auth0', 'HashiCorp', 'Datadog', 
  'Okta', 'Splunk', 'Elastic', 'MongoDB', 'Redis', 'PlanetScale', 'Neon', 'Render', 
  'Webflow', 'Algolia', 'Retool', 'Framer', 'Sanity', 'Prisma', 'Storyblok',
  'Square', 'Block', 'Robinhood', 'Wealthfront', 'Chime', 'Affirm', 'Brex', 'Ramp', 
  'Klarna', 'Gusto', 'Rippling', 'Deel', 'Carta', 'Checkr', 'Opensea', 'Chainlink',
  'Alchemy', 'Consensys', 'Dapper Labs', 'Yuga Labs', 'Matter Labs', 'Protocol Labs',
  'Solana', 'Polygon', 'Phantom', 'Magic Eden', 'Trust Wallet', 'Ledger', 'Trezor',
  'Gatsby', 'Apollo', 'Astro', 'Remix', 'Nuxt', 'Svelte', 'Solid', 'Qwik',
  'Lit', 'Stencil', 'Marko', 'Preact', 'Alpine', 'Riot', 'Ember', 'Mithril', 'Aurelia',
  'Backbone', 'Polymer', 'Knockout', 'RxJS', 'MobX', 'Redux', 'Zustand', 'Recoil',
  'Jotai', 'Valtio', 'XState', 'React Query', 'SWR', 'RTK Query', 'Apollo Client',
  'Urql', 'Relay', 'GraphQL Request', 'Framer Motion', 'React Spring', 'GSAP',
  'Three.js', 'React Three Fiber', 'D3.js', 'Babylon.js', 'PixiJS', 'Phaser',
  'Matter.js', 'Cannon.js', 'PlayCanvas', 'Kaboom.js', 'Coccos2d-x', 'Defold',
  'Playmaker', 'GDevelop', 'Cocos Creator', 'Godot', 'Construct',
  'OpenAI', 'Anthropic', 'Midjourney', 'HuggingFace', 'Scale AI', 'Databricks',
  'Etsy', 'Zendesk', 'Twillio', 'DigitalOcean', 'Linode', 'Heroku',
  'Cloudflare', 'Fastly', 'Postman', 'Posthog', 'Apollo GraphQL', 'Hasura', 'Fauna'
]);

const nonRemoteOrIrrelevant = new Set([
  'Uber', 'Lyft', 'Tesla', 'SpaceX', 'Cruise', 'Waymo', 'Zoox', 'Nuro', 'Aurora', 
  'TuSimple', 'Embark', 'DoorDash', 'Instacart', 'Grubhub', 'Postmates', 'Deliveroo', 
  'Glovo', 'Rappi', 'Gopuff', 'Getir', 'Zillow', 'Redfin', 'Opendoor', 'Compass', 
  'Expedia', 'Booking.com', 'Tripadvisor', 'Skyscanner', 'Kayak', 'Trivago', 
  'TikTok', 'ByteDance', 'Tencent', 'Alibaba', 'Baidu', 'Google', 'Apple', 'Meta', 
  'Amazon', 'Microsoft', 'AWS', 'T-Mobile', 'Verizon', 'AT&T', 'Comcast', 'Sprint',
  'Ford', 'GM', 'Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes', 'Volkswagen',
  'Audi', 'Porsche', 'Hyundai', 'Kia', 'Subaru', 'Mazda', 'Volvo', 'Peugeot',
  'Ferrari', 'Lamborghini', 'Maserati', 'Aston Martin', 'Bentley', 'Rolls Royce'
]);

// We will keep companies if they are in the remoteFriendly set OR if they are a SaaS/Tech sounding name
// AND strictly NOT in the irrelevant set.
const filtered = data.filter(d => {
  if (nonRemoteOrIrrelevant.has(d.company)) return false;
  if (remoteFriendly.has(d.company)) return true;
  
  // Heuristics to remove obvious non-remote or irrelevant companies
  const badKeywords = ['bank', 'airlines', 'motors', 'auto', 'food', 'delivery', 'insurance', 'health', 'hospital'];
  if (badKeywords.some(k => d.url.toLowerCase().includes(k) || d.company.toLowerCase().includes(k))) {
    return false;
  }
  
  return true; 
});

const strictList = data.filter(d => remoteFriendly.has(d.company));

fs.writeFileSync('data/career_urls.json', JSON.stringify(strictList, null, 4));
console.log('Filtered down to:', strictList.length, 'companies');
