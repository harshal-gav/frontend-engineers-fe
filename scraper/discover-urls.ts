import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { TOP_COMPANIES } from './top-companies';
import * as fs from 'fs';
import * as path from 'path';

chromium.use(stealth());

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface CareerUrlMapping {
  company: string;
  url: string;
}

async function discoverUrls() {
  console.log(`\n🔍 Starting URL Discovery for ${TOP_COMPANIES.length} companies...\n`);

  const outputPath = path.join(process.cwd(), 'data', 'career_urls.json');
  let existingMappings: CareerUrlMapping[] = [];

  if (fs.existsSync(outputPath)) {
    try {
      existingMappings = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      console.log(`✅ Loaded ${existingMappings.length} existing mappings from data/career_urls.json`);
    } catch (e) {
      console.error(`⚠️ Failed to parse existing data/career_urls.json:`, e);
    }
  }

  // Find companies that haven't been mapped yet
  const mappedCompanies = new Set(existingMappings.map(m => m.company));
  const companiesToSearch = TOP_COMPANIES.filter(c => !mappedCompanies.has(c));

  if (companiesToSearch.length === 0) {
    console.log(`\n🎉 All ${TOP_COMPANIES.length} companies have already been mapped!`);
    return;
  }

  console.log(`\n🔎 Need to search for ${companiesToSearch.length} missing career URLs...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    let count = 0;
    for (const company of companiesToSearch) {
      count++;
      const query = `${company} careers`;
      console.log(`   🔎 [${count}/${companiesToSearch.length}] Searching: ${query}`);
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`;
      
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000 + Math.random() * 1000);
        
        const firstLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[data-testid="result-title-a"]'));
          for (const a of links) {
            const href = (a as HTMLAnchorElement).href;
            if (!href.includes('linkedin.com') && !href.includes('glassdoor.com') && !href.includes('indeed.com') && !href.includes('comparably.com')) {
              return href;
            }
          }
          return null;
        });

        if (firstLink) {
           console.log(`   ✅ Found: ${firstLink}`);
           existingMappings.push({ company, url: firstLink });
           // Save aggressively
           fs.writeFileSync(outputPath, JSON.stringify(existingMappings, null, 2));
        } else {
           console.log(`   ⚠️ Could not find a valid organic link.`);
        }
      } catch (err) {
        console.log(`   ❌ Failed on ${company}: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      await sleep(1500 + Math.random() * 1500); // Respectful delay
    }

  } catch (err) {
    console.error(`\n❌ Fatal error during discovery:`, err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`\n🎉 Discovery complete. Total mappings: ${existingMappings.length}`);
}

discoverUrls().catch(console.error);
