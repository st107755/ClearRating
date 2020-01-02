const jsdom = require("jsdom"); // Coverting in Html Documents
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const reviewApi = require('./reviewerCraller')
const AmazonCrawler = require('./lib/AmazonCrawler');
const Db = require('./lib/DbUtils')
const { JSDOM } = jsdom;

const host = 'https://www.amazon.de'
const product = "/Emilijana-Magie-Feenherzblüte-Chronik-Elfenprinzessin-ebook/dp/B07SM129K2"
main(host,product)

async function main(host,product) {
    const db = new Db();
    const reviewPageCount = await reviewPageCount(host,product)
    const crawler = new AmazonCrawler();
    await crawler.init();
    const reviewerStatistics = await crawler.crawlProductReviews("B07SM129K2", 1,reviewPageCount )
    console.log(reviewerStatistics)
    }

    /**
     * Cralling links to all Reviewerspages
     * @param {*} reviewPages 
     * @param {*} host 
     */
    async function extractReviewers(reviewPages, host) {
        var profilePaths = new Array()
        for (i = 0; i < reviewPages.length; i++) {
            const page = reviewPages[i]
            const profiles = Array.from(page.window.document.getElementsByClassName('a-profile'))
            for (j = 0; j < profiles.length; j++) {
                const profile = profiles[j]
                profilePaths.push(host + profile.href)
            }
        }
        return profilePaths

    }

   

    /**
     * Get request with headless browser
     * @param {*} url 
     */
    async function get(url) {
        const browser = await puppeteer.launch({ headless: false});
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: "networkidle2"});
        return await page.content();
    }
