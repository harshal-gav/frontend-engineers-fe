const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://html.duckduckgo.com/html/?q=airbnb+careers');
  const elements = await page.$$('a.result__snippet, a.result__url');
  console.log('Class results found:', elements.length);
  
  // Dump all links
  const links = await page.$$eval('a', as => as.map(a => a.href).slice(0, 15));
  console.log('Links:', links);
  await browser.close();
})();
