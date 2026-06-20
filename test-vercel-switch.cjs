const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('https://tezhhomayaa-crm.vercel.app', { waitUntil: 'networkidle0' });
  
  await page.click('a[data-target="search-view"]');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    console.log("search-view active?", document.getElementById('search-view').classList.contains('active'));
  });
  
  await browser.close();
})();
