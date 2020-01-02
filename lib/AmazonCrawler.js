const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {scrollToBottom} = require('./Utils');
const fs = require('fs');
const ReviewStatistics = require('./statistics');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaCors = require('@koa/cors');
puppeteer.use(StealthPlugin());

const USER_DIRECTORY = './accounts.json';

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
    accounts = {};
    koa = null;
    router = null;

    constructor(browser = null, options = {}) {
        this.browser = browser;
        this.options = options;

        process.on("exit", () => {
            this.stop();
        });
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async init() {
        if (fs.existsSync(USER_DIRECTORY)) {
            try {
                this.accounts = JSON.parse(fs.readFileSync(USER_DIRECTORY, 'UTF-8'));
            } catch (e) {

            }
        }
        if (!this.browser) {
            this.browser = await puppeteer.launch(Object.assign({}, {headless: false}, this.options.browser || {}));
        }
        if (this.options.api) {
            await this.initApi();
        }
    }

    async initApi() {
        this.koa = new Koa;
        this.router = new KoaRouter();
        this.router.get("/productReviews/:productId", async (ctx) => {
            const {productId} = ctx.params;
            const {page, limit} = ctx.query;
            ctx.response.body = await this.crawlProductReviews(productId, page || 1, limit || 1);
        });
        this.router.get("/accountMetrics/:accountId", async (ctx) => {
            const {accountId} = ctx.params;
            ctx.response.body = await this.crawlProfile(accountId);
        });
        this.koa.use(KoaCors());
        this.koa.use(this.router.routes());
        this.koa.use(this.router.allowedMethods());
        this.koa.listen(this.options.apiPort || 3000);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async stop() {
        fs.writeFileSync(USER_DIRECTORY, JSON.stringify(this.accounts), 'UTF-8');

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

            let account = this.accounts[accountId] ? this.accounts[accountId] : await this.crawlProfile(accountId);
            account = Object.assign(account, {
                name: $('span.a-profile-name', element).text(),
                href: href,
                id: accountId
            });
            this.accounts[accountId] = account;

            reviews.push({
                id: $(element).prop("id"),
                title: $('a[data-hook="review-title"] > span', element).text(),
                text: $('span[data-hook="review-body"] > span', element).text(),
                stars: stars,
                isAbnormal: this.isAbnortal(stars, account),
                helpful: helpful,
                account: account
            });

            console.log("cawling reviews ", productId, pageIndex, i + "/" + reviewElements.length);
        }

        if ($('li.a-last').length > 0 && pageIndex < pageLimit) {
            reviews = reviews.concat(await this._crawlProductReviews(page, productId, pageIndex + 1, pageLimit));
        }
        return reviews;
    }


    /**
     * Checks if the Rating is two standart deviations from the norm
     */
    isAbnortal(stars, account) {
        const verifiedAverage = account.verifiedAverage
        const verifiedStandartDeviation = account.verifiedStandartDeviation
        if (stars < verifiedAverage - 1.96 * verifiedStandartDeviation || stars > verifiedAverage + 1.96 * verifiedStandartDeviation) {
            return true
        } else {
            return false
        }

    }


    /**
     *
     * @param accountId
     * @returns {Promise<{averageReview: number, reviewCount: number, name: string}>}
     */
    async crawlProfile(accountId) {
        if (this.accounts[accountId]) {
            return this.accounts[accountId];
        }

        const page = await this.browser.newPage();
        await page.goto(`https://www.amazon.de/gp/profile/amzn1.account.${accountId}`, {waitUntil: "networkidle2"});
        await scrollToBottom(page);

        const html = await page.content();
        const $ = cheerio.load(html);

        const reviews = [];
        const reviewCardElements = $("#profile-at-card-container > div");

        for (let i = 0; i < reviewCardElements.length; i++) {
            const review = await this._scrapeReviewCard($, reviewCardElements[String(i)])
            if (review.text != "" && review.title != "") {
                reviews.push(review);
            }
        }

        await page.close();

        const statistics = new ReviewStatistics(reviews);
        const account = this.accounts[accountId] = {
            name: $("#customer-profile-name-header > div.a-row.a-spacing-none.name-container > span").text(),
            reviewCount: reviews.length,
            detailedMetrics: await this.detailedReviewMetrics($),
            totalAverage: await statistics.totalAverage(),
            verifiedAverage: await statistics.verifiedAverage(),
            totalDiviation: await statistics.totalStandartDeviation(),
            verifiedDiviation: await statistics.verifiedStandartDeviation(),

        };

        return account;
    }

    /**
     *
     * @param $
     * @param card
     * @returns {Promise<{text: string, stars: number, title: string, article: {href: string, id: string}}>}
     * @private
     */
    async _scrapeReviewCard($, card, optinalFileds = false) {
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


};