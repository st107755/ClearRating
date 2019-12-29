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
            this.browser = await puppeteer.launch(Object.assign({}, {headless: false}, this.options.browser || {}));
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
     * @param {string} productId
     * @param {number} startPage
     * @param {number} pageLimit
     * @returns {Promise<[]>}
     */
    async crawlProductReviews(productId, startPage = 1, pageLimit = 100) {
        const page = await this.browser.newPage();
        const reviews = await this._crawlProductReviews(page, productId, startPage, pageLimit);
        await page.close();
        return reviews;
    }

    /**
     * @param {Puppeteer.Page} page
     * @param {string} productId
     * @param {number} pageIndex
     * @param {number} pageLimit
     * @returns {Promise<[]>}
     * @private
     */
    async _crawlProductReviews(page, productId, pageIndex, pageLimit) {
        await page.goto(`https://www.amazon.de/product-reviews/${productId}/?pageNumber=${pageIndex}`, {waitUntil: "networkidle2"});

        const html = await page.content();
        const $ = cheerio.load(html);

        let reviews = [];
        const reviewElements = $('[data-hook="review"]');

        for (let i = 0; i < reviewElements.length; i++) {
            const element = reviewElements[String(i)];
            const href = $("div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a", element).prop("href");
            const accountId = /([A-Z0-9]{28})/gm.test(href) ? /([A-Z0-9]{28})/gm.exec(href)[1] : "";
            const stars = $('[data-hook="review-star-rating"]', element).prop("class")
                .split(" ")
                .map((className) => this.ratingClassMap.indexOf(className))
                .find((index) => index > 0);
            let helpful = $('[data-hook="helpful-vote-statement"]', element).text();
            helpful = parseInt(helpful.replace(/[^0-9]/gm, "")) || 0;
            const account = Object.assign({}, await this.crawlProfile(accountId), {
                name: $('span.a-profile-name', element).text(),
                href: href,
                id: accountId
            });

            reviews.push({
                title: $('a[data-hook="review-title"] > span', element).text(),
                text: $('span[data-hook="review-body"] > span', element).text(),
                stars: stars,
                helpful: helpful,
                account: account
            });
        }

        if ($('li.a-last').length > 0 && pageIndex < pageLimit) {
            reviews = reviews.concat(await this._crawlProductReviews(page, productId, pageIndex + 1, pageLimit));
        }
        return reviews;
    }

    /**
     *
     * @param accountId
     * @returns {Promise<{averageReview: number, reviewCount: number, name: string}>}
     */
    async crawlProfile(accountId) {
        const page = await this.browser.newPage();
        await page.goto(`https://www.amazon.de/gp/profile/amzn1.account.${accountId}`, {waitUntil: "networkidle2"});
        await scrollToBottom(page);

        const html = await page.content();
        const $ = cheerio.load(html);

        const reviews = [];
        const reviewCardElements = $("#profile-at-card-container > div");

        for (let i = 0; i < reviewCardElements.length; i++) {
            reviews.push(await this._scrapeReviewCard($, reviewCardElements[String(i)]));
        }

        let verifiedStars = 0;
        reviews.filter(({isVerified}) => isVerified).forEach(({stars}) => {
            verifiedStars += stars;
        });

        await page.close();

        return {
            name: $("#customer-profile-name-header > div.a-row.a-spacing-none.name-container > span").text(),
            reviews: reviews,
            reviewCount: reviews.length,

            averageReview: totalStars / reviews.length,
            // verifiedAverage : ,
            detailedMetrics: await this.detailedReviewMetrics($)

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
        const stars = ($("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini > div > i", card).prop("class") || "").split(" ")
            .map((className) => this.ratingClassMap.indexOf(className))
            .find((index) => index > 0);
        const text = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > p", card).text();
        const articleHref = $("div:nth-child(2) > div.a-section.profile-at-content > div > a", card).prop("href");
        const articleId = /([A-Z0-9]{10})/gm.test(articleHref) ? /([A-Z0-9]{10})/gm.exec(articleHref)[1] : "";
        const isVerified = $('[data-hook="avp-badge"], span.profile-at-review-badge', card).length > 0;

        return {
            title: title,
            text: text,
            stars: stars,
            isVerified: isVerified,
            article: {
                href: articleHref,
                id: articleId
            }
        };
    }

    reviewCounter(reviews) {
        return Array.from(reviews).length
    }

    async detailedReviewMetrics($) {
        return {
            _5stars: this.reviewCounter(await $('.a-star-5')),
            _4stars: this.reviewCounter(await $('.a-star-4')),
            _3stars: this.reviewCounter(await $('.a-star-3')),
            _2stars: this.reviewCounter(await $('.a-star-2')),
            _1stars: this.reviewCounter(await $('.a-star-1'))
        }
    }

    async verifiedAverage($){

    }
};