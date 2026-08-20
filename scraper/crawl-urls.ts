import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { type NormalizedJob, generateSourceHash, inferExperienceLevel, inferEmploymentType } from './normalizer';
import { askGeminiToClick, ClickableElement } from './agentic-crawler';
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

export async function scrapeDuckDuckGoJobs(log: (msg: string) => void): Promise<{ jobs: NormalizedJob[]; errors: string[]; duration: number }> {
  const start = Date.now();
  const errors: string[] = [];
  const jobs: NormalizedJob[] = [];
  
  const mappingsPath = path.join(process.cwd(), 'data', 'career_urls.json');
  if (!fs.existsSync(mappingsPath)) {
    log(`❌ Error: data/career_urls.json not found! Run 'npm run discover' first.`);
    return { jobs, errors: ['Missing mappings file'], duration: 0 };
  }

  const mappings: CareerUrlMapping[] = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));
  
  if (mappings.length === 0) {
    log(`⚠️ Mappings file is empty. Run 'npm run discover' first.`);
    return { jobs, errors: [], duration: 0 };
  }

  // Make API key optional - skip agentic clicking if not provided
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    log(`⚠️ GEMINI_API_KEY is not set. Skipping agentic clicking loop.`);
  }

  // LIMIT TO 10 FOR TESTING
  const mappingsToCrawl = mappings.slice(0, 10);
  log(`\n🔍 Starting Agentic AI Crawl for ${mappingsToCrawl.length} company URLs...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });

    let count = 0;
    for (const mapping of mappingsToCrawl) {
      count++;
      const { company, url: firstLink } = mapping;
      const page = await context.newPage();
      
      log(`   🔎 [${count}/${mappingsToCrawl.length}] Crawling ${company} (${firstLink})`);
      
      try {
        await page.goto(firstLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(3000); // Let SPA load

        // Find all job links on the page
        let jobLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => {
                const h = href.toLowerCase();
                return h.includes('job') || h.includes('role') || h.includes('position') || h.includes('opening') || h.includes('requisition') || h.includes('career');
            });
        });

        let uniqueJobLinks = [...new Set(jobLinks)].filter(l => l !== firstLink && l.startsWith('http'));

        // AGENTIC LOOP: If no jobs found, ask Gemini what to click (only if API key is present)
        if (uniqueJobLinks.length === 0 && apiKey) {
            log(`   🤖 No jobs visible! Asking Gemini Agent to navigate the SPA...`);
            
            // Extract all clickable elements
            const clickableElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
                return elements.map((el, i) => ({
                    index: i,
                    text: (el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 50),
                    tag: el.tagName
                })).filter(e => e.text.length > 2);
            });

            if (clickableElements.length > 0) {
                const indexToClick = await askGeminiToClick(apiKey, clickableElements, company);
                
                if (indexToClick !== null && indexToClick >= 0) {
                    const elText = clickableElements.find(e => e.index === indexToClick)?.text;
                    log(`   🎯 Gemini decided to click element [${indexToClick}]: "${elText}"`);
                    
                    // Execute the click using Playwright evaluate
                    await page.evaluate((idx) => {
                        const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
                        const target = elements[idx] as HTMLElement;
                        if (target) target.click();
                    }, indexToClick);

                    await sleep(4000); // Wait for the SPA to load the jobs

                    // Re-scan for jobs
                    const newJobLinks = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('a'))
                            .map(a => a.href)
                            .filter(href => {
                                const h = href.toLowerCase();
                                return h.includes('job') || h.includes('role') || h.includes('position') || h.includes('opening') || h.includes('requisition');
                            });
                    });
                    uniqueJobLinks = [...new Set(newJobLinks)].filter(l => l !== firstLink && l.startsWith('http'));
                } else {
                    log(`   🤷 Gemini couldn't find a logical button to click.`);
                }
            }
        }

        // If we found a generic /jobs page but no specific job postings, navigate deeper
        if (uniqueJobLinks.length === 1 && uniqueJobLinks[0].includes('job')) {
            log(`   🔄 Navigating deeper into ${uniqueJobLinks[0]}...`);
            await page.goto(uniqueJobLinks[0], { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(3000);
            const deeperLinks = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => {
                    const h = href.toLowerCase();
                    return h.includes('job') || h.includes('role') || h.includes('position') || h.includes('opening') || h.includes('requisition');
                });
            });
            uniqueJobLinks = [...new Set(deeperLinks)].filter(l => l !== uniqueJobLinks[0] && l.startsWith('http'));
        }

        uniqueJobLinks = uniqueJobLinks.slice(0, 10); // Limit to top 10 links per company
        
        log(`   ✅ Found ${uniqueJobLinks.length} potential job links to scrape.`);

        // Scrape each job link
        let jobIndex = 0;
        for (const link of uniqueJobLinks) {
          jobIndex++;
          log(`      📄 [${jobIndex}/${uniqueJobLinks.length}] Scraping: ${link}`);
          
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await sleep(2000); // Let SPA load
            
            const extracted = await page.evaluate(() => {
              let title = document.querySelector('h1')?.textContent?.trim() || '';
              if (!title) {
                 const h2 = document.querySelector('h2');
                 if (h2) title = h2.textContent?.trim() || '';
                 else title = document.title;
              }
              
              const description = document.body.innerText.substring(0, 1500);
              const locEl = document.querySelector('.location, .sort-by-location, [class*="location"]');
              const location = locEl?.textContent?.trim() || 'Remote';
              
              return { title, description, location };
            });

            if (extracted.title && extracted.title.length > 3 && extracted.description.length > 100) {
               const companyId = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
               const hash = generateSourceHash(companyId, extracted.title, extracted.location);
               const fullText = extracted.title + ' ' + extracted.description;
               
               jobs.push({
                 id: hash,
                 title: extracted.title,
                 company: {
                   id: companyId,
                   name: company,
                   logoUrl: null,
                   industry: 'Technology',
                   website: firstLink
                 },
                 applyUrl: link,
                 description: extracted.description.substring(0, 500),
                 location: extracted.location,
                 city: null,
                 state: null,
                 country: null,
                 remoteType: 'REMOTE',
                 salaryMin: null,
                 salaryMax: null,
                 currency: 'USD',
                 experienceLevel: inferExperienceLevel(extracted.title, extracted.description),
                 employmentType: inferEmploymentType(fullText),
                 department: null,
                 postedAt: new Date(),
                 sourceHash: hash
               });
            }
          } catch (err) {
            log(`      ❌ Failed to scrape ${link}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      } catch (err) {
        log(`   ❌ Failed on company ${company}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await page.close();
      }
      
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    log(`❌ Fatal error in Generic Crawl: ${msg}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return {
    jobs,
    errors,
    duration: Date.now() - start
  };
}
