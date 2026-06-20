const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => console.log('WINDOW ERROR:', e.message));
    window.addEventListener('unhandledrejection', e => console.log('UNHANDLED REJECTION:', e.reason));
  });

  console.log("Navigating to https://tezhhomayaa-crm.vercel.app ...");
  await page.goto('https://tezhhomayaa-crm.vercel.app', { waitUntil: 'networkidle0' });
  
  const targets = [
    'dashboard-view',
    'search-view',
    'builder-view',
    'quote-view',
    'buyers-view',
    'orders-view',
    'reports-view',
    'settings-view'
  ];
  
  for (const t of targets) {
    console.log("Clicking", t);
    await page.evaluate((target) => {
      const el = document.querySelector(`a[data-target="${target}"]`);
      if (el) el.click();
      else console.log("Could not find", target);
    }, t);
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
})();
