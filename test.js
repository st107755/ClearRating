const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

main();

async function main() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.goto("https://www.amazon.de/gp/profile/amzn1.account.AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA");
    await page.screenshot({path: 'debug.png'});
    await browser.close();
}