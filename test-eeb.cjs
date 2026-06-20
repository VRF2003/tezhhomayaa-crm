const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:4175', { waitUntil: 'networkidle0' });
  
  console.log("Before click:");
  await page.evaluate(() => {
    console.log("dashboard-view active?", document.getElementById('dashboard-view').classList.contains('active'));
    console.log("search-view active?", document.getElementById('search-view').classList.contains('active'));
  });
  
  await page.click('a[data-target="search-view"]');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("After click:");
  await page.evaluate(() => {
    console.log("dashboard-view active?", document.getElementById('dashboard-view').classList.contains('active'));
    console.log("search-view active?", document.getElementById('search-view').classList.contains('active'));
  });
  
  await browser.close();
})();
