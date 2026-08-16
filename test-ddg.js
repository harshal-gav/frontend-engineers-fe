const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://html.duckduckgo.com/html/?q=airbnb+careers');
  const html = await page.content();
  console.log(html.substring(0, 500));
  const results = await page.$$('a.result__url');
  console.log('Found:', results.length);
  await browser.close();
})();
