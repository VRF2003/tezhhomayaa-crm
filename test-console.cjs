const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navigating to http://localhost:4175 ...");
  await page.goto('http://localhost:4175', { waitUntil: 'networkidle0' });
  
  // Try a navigation click
  console.log("Clicking Product Search nav link...");
  await page.click('a[data-target="search-view"]');
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
