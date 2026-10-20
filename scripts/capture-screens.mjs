import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const out = '/opt/cursor/artifacts/screenshots';
mkdirSync(out, { recursive: true });
const url = 'http://localhost:8080/quit-tracker/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: 'networkidle' });

const setup = page.locator('#modal-setup.open');
if (await setup.count()) {
  await page.fill('#setup-name', 'Silvio');
  await page.click('#setup-form button[type="submit"]');
  await page.waitForTimeout(800);
}

await page.screenshot({ path: `${out}/dashboard-mobile.png`, fullPage: true });

await page.click('.nav-btn[data-nav="rank"]');
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/rank-ladder-mobile.png`, fullPage: true });

await page.click('.nav-btn[data-nav="home"]');
await page.click('#btn-craving');
await page.waitForSelector('#modal-craving.open');
await page.screenshot({ path: `${out}/craving-modal-mobile.png`, fullPage: true });

await page.click('#btn-breathe', { force: true });
await page.waitForSelector('#modal-breathing.open', { timeout: 5000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/breathing-mobile.png`, fullPage: true });

await browser.close();
console.log('done');
