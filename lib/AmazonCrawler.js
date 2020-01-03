const cheerio = require('cheerio');
const jsdom = require("jsdom"); // Coverting in Html Documents
const {JSDOM} = jsdom;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Promise = require('bluebird');
const moment = require('moment');
const {scrollToBottom, covertToDate} = require('./Utils');
const fs = require('fs');
const ReviewStatistics = require('./statistics');
const db = require('./DbUtils');
puppeteer.use(StealthPlugin());

const USER_DIRECTORY = './accounts.json';

module.exports = class AmazonCrawler {
    /**
     * @type {Puppeteer.Browser}
     */
    browser = null;
    options = {};
    accounts = {};

    constructor(browser = null, options = {}) {
        this.browser = browser;
        this.options = options;
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
            this.browser = await puppeteer.launch(Object.assign({}, {
                headless: false,
                //args: ['--proxy-server=80.78.75.59:38253']
            }, this.options.browser || {}));
        }
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
    async crawlProductReviews(productId) {
        const page = await this.browser.newPage();
        const product = await this._crawlProductReviews(page, productId, 1);
        await page.close();
        await db.putProduct(product);
        return product;
    }

    /**
     * @param {Puppeteer.Page} page
     * @param {string} productId
     * @param {number} pageIndex
     * @param {number} pageLimit
     * @returns {Promise<[]>}
     * @private
     */
    async _crawlProductReviews(page, productId, pageIndex) {
        await page.goto(`https://www.amazon.de/product-reviews/${productId}/?pageNumber=${pageIndex}`, {waitUntil: "networkidle2"});

        const html = await page.content();
        const $ = cheerio.load(html);

        let reviews = [];
        const reviewElements = $('[data-hook="review"]');

        for (let i = 0; i < reviewElements.length; i++) {
            const reviewElement = reviewElements[String(i)];

            const href = $("div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a", reviewElement).prop("href");
            const accountId = /([A-Z0-9]{28})/gm.test(href) ? /([A-Z0-9]{28})/gm.exec(href)[1] : "";
            const stars = parseInt(/a-star-(\d)/.exec($('[data-hook="review-star-rating"]', reviewElement).prop("class"))[1]);
            let helpful = $('[data-hook="helpful-vote-statement"]', reviewElement).text();
            helpful = parseInt(helpful.replace(/[^0-9]/gm, "")) || 0;
            let date = moment($('[data-hook="review-date"]', reviewElement).text(), "DD. MMM YYYY", "de");

            reviews.push({
                title: $('[data-hook="review-title"] > span', reviewElement).text(),
                accountId: accountId,
                date: date.toDate(),
                stars: stars,
                helpful: helpful,
                isVerified: $('[data-hook="avp-badge"]').length > 0,
                isVine: ($("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini", reviewElement).text().indexOf("Vine") !== -1)
            });

            await this.crawlProfile(accountId);
        }

        if ($('li.a-last').length > 0) {
            const {reviews: nextReviews} = await this._crawlProductReviews(page, productId, pageIndex + 1);
            reviews = reviews.concat(nextReviews);
        }

        return {
            _id: productId,
            crawledAt: new Date(),
            title: $('#cm_cr-product_info .a-row.product-title > h1 > a').text(),
            reviews: reviews
        };
    }

    /**
     *
     * @param accountId
     * @returns {Promise<{averageReview: number, reviewCount: number, name: string}>}
     */
    async crawlProfile(accountId) {
        if (await db.hasReviewer(accountId)) {
            return;
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

        const reviewerData = {
            _id: accountId,
            crawledAt: new Date(),
            name: $("#customer-profile-name-header > div.a-row.a-spacing-none.name-container > span").text(),
            usefullVoices: $(".dashboard-desktop-card > .a-row > .dashboard-desktop-stats-section > .dashboard-desktop-stat > .dashboard-desktop-stat-link > div > .dashboard-desktop-stat-value").first().text(),
            reviewCount: $(".dashboard-desktop-card > .a-row > .dashboard-desktop-stats-section > .dashboard-desktop-stat > .dashboard-desktop-stat-link > div > .dashboard-desktop-stat-value").last().text(),
            metrics: reviews
        };

        await db.putReviewer(reviewerData);

        return reviewerData;
    }

    /**
     *
     * @param $
     * @param card
     * @returns {Promise<{text: string, stars: number, title: string, article: {href: string, id: string}}>}
     * @private
     */
    async _scrapeReviewCard($, card, optinalFileds = false) {
        //For Replace Operation (Cange for different language)
        const preFixForDate = "Hat ein Produkt bewertet  · ";


        const title = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > h1 > span > span", card).text();
        const starClasses = $('div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini > div > i', card).prop("class") || "";
        const stars = /a-star-(\d)/.test(starClasses) ? parseInt(/a-star-(\d)/.exec(starClasses)[1]) : 0;
        const articleHref = $("div:nth-child(2) > div.a-section.profile-at-content > div > a", card).prop("href");
        const articleId = /([A-Z0-9]{10})/gm.test(articleHref) ? /([A-Z0-9]{10})/gm.exec(articleHref)[1] : "";
        const isVerified = $('[data-hook="avp-badge"], span.profile-at-review-badge', card).length > 0;
        const isVine = ($("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini", card).text().indexOf("Vine") != -1)
        const date = covertToDate($(".profile-at-user-info > .a-profile > .a-profile-content > .a-profile-descriptor ", card).text().replace(preFixForDate, ""))


        return {
            title: title,
            stars: stars,
            date: date,
            isVerified: isVerified,
            isVine: isVine,
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