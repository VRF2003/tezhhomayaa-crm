const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' }).catch(e => console.log(e));
  
  // click search view
  await page.evaluate(() => {
    document.querySelector('.nav-link[data-target="search-view"]')?.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
