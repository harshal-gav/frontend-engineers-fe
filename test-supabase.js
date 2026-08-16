const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://supabase.com/careers', { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  
  // Find anything that looks like a job link or title
  const jobs = await page.$$eval('a', links => {
    return links
      .filter(a => a.href.includes('greenhouse.io') || a.textContent.toLowerCase().includes('engineer'))
      .map(a => ({ text: a.textContent.trim(), href: a.href }));
  });
  
  console.log("Jobs found on supabase.com/careers:");
  console.log(jobs.slice(0, 10));
  
  await browser.close();
})();
