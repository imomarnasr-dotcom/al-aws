const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE UNCAUGHT ERROR:', error.message));
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 8000 });
    await page.evaluate(() => {
      localStorage.setItem('moo_user', JSON.stringify({ id: 'aws00001', name: 'Admin', role: 'cafeteria' }));
    });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 8000 });
    await new Promise(r => setTimeout(r, 5000));
    console.log('Finished waiting');
  } catch (err) {
    console.error('FAILED', err.message);
  }
  await browser.close();
})();
