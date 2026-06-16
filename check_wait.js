const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text()); });
  page.on('pageerror', error => console.log('PAGE UNCAUGHT ERROR:', error.message));
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    // wait for 5 seconds to let preloader finish
    await new Promise(r => setTimeout(r, 5000));
    console.log('Finished waiting');
  } catch (err) {
    console.error('FAILED', err.message);
  }
  await browser.close();
})();
