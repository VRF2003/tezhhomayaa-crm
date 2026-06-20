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
  
  await browser.close();
})();
