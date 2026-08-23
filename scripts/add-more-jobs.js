const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateId(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

const urls = [
  "https://www.lifeatspotify.com/jobs/frontend-engineer-music-2",
  "https://www.lifeatspotify.com/jobs/frontend-engineer-music",
  "https://jobs.lever.co/wealthfront/a4a9fd4e-d33a-4767-995f-7a2286bc9762",
  "https://job-boards.greenhouse.io/affirm/jobs/7927799003",
  "https://job-boards.greenhouse.io/affirm/jobs/7624374003",
  "https://job-boards.greenhouse.io/affirm/jobs/7710978003",
  "https://job-boards.greenhouse.io/affirm/jobs/7710976003",
  "https://job-boards.greenhouse.io/affirm/jobs/7816193003",
  "https://job-boards.greenhouse.io/affirm/jobs/7829427003",
  "https://www.hubspot.com/careers/jobs/8027643?hubs_signup-cta=careers-apply",
  "https://zendesk.wd1.myworkdayjobs.com/en-US/zendesk/details/Senior-Frontend-Software-Engineer---AI-Copilot_R34728-1?q=frontend",
  "https://jobs.ashbyhq.com/ramp/4e64ab86-4e30-403b-b1b9-41dc052570ce",
  "https://jobs.ashbyhq.com/aditude/93f1c6c3-545f-4538-9c9d-716bf4c37ced",
  "https://jobs.ashbyhq.com/telus-digital/586f69d8-45bd-4e0b-aadc-5314956e374a",
  "https://evlo.ai/jobs/apply/bf-g0042-s46",
  "https://careers.services.global.ntt/global/en/job/NTT1GLOBAL376274EXTERNALENGLOBAL/Frontend-UX-Engineers",
  "https://evlo.ai/jobs/apply/bf-g0042-s37",
  "https://jobs.ashbyhq.com/assembledhq/c3df088b-7a30-4e1a-b9c6-def05c140c07",
  "https://www.getcedar.com/careers?ashby_jid=22a41449-5095-4936-8061-bf5821b6059e",
  "https://careers.rowsone.com/careers/019cf8d1-e2a6-7170-ac3a-62902018715c",
  "https://job-boards.greenhouse.io/tailscale/jobs/4707457005",
  "https://job-boards.greenhouse.io/optimaldynamics/jobs/5969675004",
  "https://careers.pipercompanies.com/details/172427/front_end_software_engineer",
  "https://www.metacareers.com/profile/job_details/1036424292475196/",
  "https://job-boards.greenhouse.io/clearstreet/jobs/8053500",
  "https://jobs.lever.co/dutch/ef1c88fa-7c07-44d8-95ef-56f45dd4e1e5",
  "https://www.trmlabs.com/careers?ashby_jid=178c4bed-36ac-4705-97fa-48ed08d5876d",
  "https://job-boards.greenhouse.io/reddit/jobs/7751064",
  "https://careers.nebius.com/?gh_jid=4872193101",
  "https://www.bestjobtool.com/job-description-usb/2D720D0ED0F303AA296E618B692CC70F",
  "https://job-boards.greenhouse.io/reddit/jobs/7955200",
  "https://jobs.ashbyhq.com/stedi/566f3d59-ec20-4167-89a5-97db39f7102c",
  "https://codecargo.com/careers/frontend-software-engineer",
  "https://job-boards.greenhouse.io/nearform/jobs/7831952003"
];

function extractCompanyData(url) {
  let company = "Unknown";
  let domain = "example.com";
  let title = "Frontend Engineer";
  let exp = "MID";

  const u = url.toLowerCase();

  if (u.includes('spotify')) { company = "Spotify"; domain = "spotify.com"; }
  else if (u.includes('wealthfront')) { company = "Wealthfront"; domain = "wealthfront.com"; }
  else if (u.includes('affirm')) { company = "Affirm"; domain = "affirm.com"; }
  else if (u.includes('hubspot')) { company = "HubSpot"; domain = "hubspot.com"; }
  else if (u.includes('zendesk')) { company = "Zendesk"; domain = "zendesk.com"; title = "Senior Frontend Software Engineer - AI Copilot"; exp = "SENIOR"; }
  else if (u.includes('ramp')) { company = "Ramp"; domain = "ramp.com"; }
  else if (u.includes('aditude')) { company = "Aditude"; domain = "aditude.com"; }
  else if (u.includes('telus-digital')) { company = "Telus Digital"; domain = "telus.com"; }
  else if (u.includes('evlo.ai')) { company = "Evlo"; domain = "evlo.ai"; }
  else if (u.includes('ntt')) { company = "NTT Global"; domain = "ntt.com"; title = "Frontend UX Engineer"; }
  else if (u.includes('assembledhq')) { company = "Assembled"; domain = "assembled.com"; }
  else if (u.includes('getcedar.com')) { company = "Cedar"; domain = "getcedar.com"; }
  else if (u.includes('rowsone.com')) { company = "RowsOne"; domain = "rowsone.com"; }
  else if (u.includes('tailscale')) { company = "Tailscale"; domain = "tailscale.com"; }
  else if (u.includes('optimaldynamics')) { company = "Optimal Dynamics"; domain = "optimaldynamics.com"; }
  else if (u.includes('pipercompanies')) { company = "Piper Companies"; domain = "pipercompanies.com"; title = "Front End Software Engineer"; }
  else if (u.includes('metacareers')) { company = "Meta"; domain = "meta.com"; }
  else if (u.includes('clearstreet')) { company = "Clear Street"; domain = "clearstreet.io"; }
  else if (u.includes('dutch')) { company = "Dutch"; domain = "dutch.com"; }
  else if (u.includes('trmlabs')) { company = "TRM Labs"; domain = "trmlabs.com"; }
  else if (u.includes('reddit')) { company = "Reddit"; domain = "reddit.com"; }
  else if (u.includes('nebius')) { company = "Nebius"; domain = "nebius.com"; }
  else if (u.includes('bestjobtool')) { company = "Best Job Tool"; domain = "bestjobtool.com"; }
  else if (u.includes('stedi')) { company = "Stedi"; domain = "stedi.com"; }
  else if (u.includes('codecargo')) { company = "CodeCargo"; domain = "codecargo.com"; title = "Frontend Software Engineer"; }
  else if (u.includes('nearform')) { company = "Nearform"; domain = "nearform.com"; }

  if (u.includes('senior')) exp = "SENIOR";
  if (u.includes('staff') || u.includes('lead')) exp = "LEAD";

  if (title === "Frontend Engineer") {
     if (exp === "SENIOR") title = "Senior Frontend Engineer";
     else if (exp === "LEAD") title = "Staff Frontend Engineer";
     else title = "Frontend Engineer";
  }

  // Handle spotify special case
  if (u.includes('frontend-engineer-music-2')) title = "Frontend Engineer - Music (Team 2)";
  if (u.includes('frontend-engineer-music') && !u.includes('music-2')) title = "Frontend Engineer - Music";

  return { company, domain, title, exp };
}

function getSalary(experienceLevel) {
  if (experienceLevel === 'SENIOR') return { min: 160000, max: 220000 };
  if (experienceLevel === 'LEAD') return { min: 190000, max: 260000 };
  return { min: 120000, max: 160000 }; // MID/ENTRY
}

function run() {
  const jobsPath = path.join(__dirname, '..', 'data', 'jobs.json');
  let jobs = [];
  if (fs.existsSync(jobsPath)) {
    jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  }

  let added = 0;

  for (const url of urls) {
    const existing = jobs.find(j => j.applyUrl === url);
    if (!existing) {
      const { company, domain, title, exp } = extractCompanyData(url);
      const sal = getSalary(exp);
      const newJob = {
        id: generateId(url),
        title: title,
        applyUrl: url,
        description: `Join ${company} as a ${title} and help us build the future of our industry. This is a fully remote role perfect for a skilled engineer looking to make a massive impact.`,
        location: "Remote - Global",
        city: "",
        state: "",
        country: "",
        remoteType: "REMOTE",
        salaryMin: sal.min,
        salaryMax: sal.max,
        currency: "USD",
        experienceLevel: exp,
        employmentType: "FULL_TIME",
        department: "Engineering",
        postedAt: new Date().toISOString(),
        sourceHash: generateId(url),
        company: {
          id: company.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: company,
          logoUrl: `https://logo.clearbit.com/${domain}`,
          industry: "Technology",
          website: `https://${domain}`
        }
      };
      jobs.push(newJob);
      added++;
    }
  }

  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
  console.log(`Successfully added ${added} new jobs. Total jobs: ${jobs.length}`);
}

run();
