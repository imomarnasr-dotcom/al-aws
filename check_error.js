const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT ERROR:', error.message);
  });

  try {
    // Check Cafeteria
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 5000 });
    // Assume user is logged in, or we might need to set localStorage
    // Let's set localStorage to simulate cafeteria role
    await page.evaluate(() => {
      localStorage.setItem('moo_role', 'cafeteria');
    });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 5000 });
    console.log('Successfully loaded Cafeteria Admin Dashboard');
  } catch (err) {
    console.error('FAILED TO LOAD OR TIMEOUT', err.message);
  }

  await browser.close();
})();
