const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text()); });
  page.on('pageerror', error => console.log('PAGE UNCAUGHT ERROR:', error.message));
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 5000 });
    console.log('Successfully loaded on 5174');
  } catch (err) {
    console.error('FAILED TO LOAD OR TIMEOUT', err.message);
  }
  await browser.close();
})();
