const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {scrollToBottom} = require('./Utils');
puppeteer.use(StealthPlugin());

module.exports = class AmazonCrawler {
    /**
     * @type {Puppeteer.Browser}
     */
    browser = null;
    options = {};
    ratingClassMap = [
        "",
        "a-star-1",
        "a-star-2",
        "a-star-3",
        "a-star-4",
        "a-star-5",
    ];

    constructor(browser = null, options = {}) {
        this.browser = browser;
        this.options = options;
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch(Object.assign({}, {headless: true}, this.options.browser || {}));
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async stop() {
        if (this.browser) {
            return this.browser.close();
        }
    }

    /**
     *
     * @param accountId
     * @returns {Promise<{averageReview: number, reviewCount: number, name: string}>}
     */
    async crawlProfile(accountId) {
        const page = await this.browser.newPage();
        await page.goto(`https://www.amazon.de/gp/profile/amzn1.account.${accountId}`);
        await scrollToBottom(page);

        const html = await page.content();
        const $ = cheerio.load(html);

        const reviews = [];
        const reviewCardElements = $("#profile-at-card-container > div");

        for (let i = 0; i < reviewCardElements.length; i++) {
            reviews.push(await this._scrapeReviewCard($, reviewCardElements[String(i)]));
        }

        let totalStars = 0;
        reviews.map(({stars}) => {
            totalStars += stars;
        });

        return {
            name: $("#customer-profile-name-header > div.a-row.a-spacing-none.name-container > span").text(),
            reviewCount: reviews.length,
            averageReview: totalStars / reviews.length
        };
    }

    /**
     *
     * @param $
     * @param card
     * @returns {Promise<{text: string, stars: number, title: string, article: {href: string, id: string}}>}
     * @private
     */
    async _scrapeReviewCard($, card) {
        const title = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > h1 > span > span", card).text();
        const stars = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini > div > i", card)
            .prop("class")
            .split(" ")
            .map((className) => this.ratingClassMap.indexOf(className))
            .find((index) => index > 0);
        const text = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > p", card).text();
        const articleHref = $("div:nth-child(2) > div.a-section.profile-at-content > div > a", card).prop("href");
        const articleId = /([A-Z0-9]{10})/gm.test(articleHref) ? /([A-Z0-9]{10})/gm.exec(articleHref)[1] : "";

        return {
            title: title,
            text: text,
            article: {
                href: articleHref,
                id: articleId
            },
            stars: stars
        };
    }
};