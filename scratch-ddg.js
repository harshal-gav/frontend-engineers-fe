const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://careers.bungie.com/jobs', { waitUntil: 'networkidle' });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href.includes('job') || href.includes('role') || href.includes('position'));
  });
  console.log("Found job links:", [...new Set(links)]);
  await browser.close();
})();
