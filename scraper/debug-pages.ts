import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  // Test 1: Greenhouse (GitHub)
  console.log('\n=== Testing Greenhouse (GitHub) ===');
  const p1 = await context.newPage();
  await p1.goto('https://boards.greenhouse.io/github', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p1.waitForTimeout(3000);

  const ghContent = await p1.evaluate(() => {
    // List all major structural elements
    const openings = document.querySelectorAll('.opening');
    const links = document.querySelectorAll('a[href*="/jobs/"]');
    const allLinks = document.querySelectorAll('a');
    const sections = document.querySelectorAll('section');
    const h2s = document.querySelectorAll('h2, h3');

    return {
      url: window.location.href,
      title: document.title,
      openingsCount: openings.length,
      jobLinksCount: links.length,
      allLinksCount: allLinks.length,
      sectionsCount: sections.length,
      headingsCount: h2s.length,
      headingTexts: Array.from(h2s).slice(0, 10).map(h => h.textContent?.trim()),
      sampleLinks: Array.from(links).slice(0, 5).map(a => ({
        text: a.textContent?.trim()?.substring(0, 80),
        href: a.getAttribute('href'),
      })),
      bodySnippet: document.body?.textContent?.trim()?.substring(0, 500),
    };
  });

  console.log(JSON.stringify(ghContent, null, 2));
  await p1.close();

  // Test 2: Ashby (Vercel)
  console.log('\n=== Testing Ashby (Vercel) ===');
  const p2 = await context.newPage();
  await p2.goto('https://jobs.ashbyhq.com/vercel', { waitUntil: 'networkidle', timeout: 30000 });
  await p2.waitForTimeout(5000);

  const vercelContent = await p2.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const jobLinks = Array.from(allLinks).filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('/jobs/') || href.includes('/vercel/');
    });

    return {
      url: window.location.href,
      title: document.title,
      allLinksCount: allLinks.length,
      jobLinksCount: jobLinks.length,
      sampleJobLinks: jobLinks.slice(0, 10).map(a => ({
        text: a.textContent?.trim()?.substring(0, 80),
        href: a.getAttribute('href'),
        parentClass: a.parentElement?.className?.substring(0, 50),
      })),
      bodySnippet: document.body?.textContent?.trim()?.substring(0, 500),
    };
  });

  console.log(JSON.stringify(vercelContent, null, 2));
  await p2.close();

  // Test 3: Stripe
  console.log('\n=== Testing Stripe ===');
  const p3 = await context.newPage();
  await p3.goto('https://stripe.com/jobs/search', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p3.waitForTimeout(5000);

  const stripeContent = await p3.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const jobLinks = Array.from(allLinks).filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('/jobs/') && !href.includes('/search');
    });

    return {
      url: window.location.href,
      title: document.title,
      allLinksCount: allLinks.length,
      jobLinksCount: jobLinks.length,
      sampleJobLinks: jobLinks.slice(0, 10).map(a => ({
        text: a.textContent?.trim()?.substring(0, 80),
        href: a.getAttribute('href'),
      })),
      bodySnippet: document.body?.textContent?.trim()?.substring(0, 500),
    };
  });

  console.log(JSON.stringify(stripeContent, null, 2));
  await p3.close();

  await browser.close();
}

debug().catch(console.error);
