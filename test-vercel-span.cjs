const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://tezhhomayaa-crm.vercel.app', { waitUntil: 'networkidle0' });
  
  console.log("Clicking the span inside nav-link...");
  await page.evaluate(() => {
    const span = document.querySelector('a[data-target="search-view"] .nav-icon');
    if (span) span.click();
    else console.log("Span not found!");
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
