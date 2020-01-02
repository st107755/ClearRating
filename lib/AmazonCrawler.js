const cheerio = require('cheerio');
const jsdom = require("jsdom"); // Coverting in Html Documents
const { JSDOM } = jsdom;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { scrollToBottom } = require('./Utils');
const { covertToDate } = require('./Utils');
const fs = require('fs');
const ReviewStatistics = require('./statistics');
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
            this.browser = await puppeteer.launch(Object.assign({}, { headless: false }, this.options.browser || {}));
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
        const reviews = await this._crawlProductReviews(page, productId, 1, await this.reviewPageCount(productId));
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
        await page.goto(`https://www.amazon.de/product-reviews/${productId}/?pageNumber=${pageIndex}`, { waitUntil: "networkidle2" });

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
                _id: accountId
            });
            this.accounts[accountId] = account;

            reviews.push(account)
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
        const page = await this.browser.newPage();
        await page.goto(`https://www.amazon.de/gp/profile/amzn1.account.${accountId}`, { waitUntil: "networkidle2" });
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


        return {
            name: $("#customer-profile-name-header > div.a-row.a-spacing-none.name-container > span").text(),
            usefullVoices : $(".dashboard-desktop-card > .a-row > .dashboard-desktop-stats-section > .dashboard-desktop-stat > .dashboard-desktop-stat-link > div > .dashboard-desktop-stat-value").first().text(),
            reviewCount : $(".dashboard-desktop-card > .a-row > .dashboard-desktop-stats-section > .dashboard-desktop-stat > .dashboard-desktop-stat-link > div > .dashboard-desktop-stat-value").last().text(),
            metrics : reviews
        };
    }
    /**
     * 
     * @param {*} host 
     * @param {*} path 
     */
    async reviewPageCount(productId) {
        const host = "https://www.amazon.de/"
        var nextPage = `https://www.amazon.de/product-reviews/${productId}/`
        var hasNextPage = true
        var urls = new Array();
        var nextPagePath;
        var reviewPages = new Array()
        while (hasNextPage) {
            const firstPage = await this.get(nextPage)
            const dom = new JSDOM(firstPage);
            reviewPages.push(dom)
            urls.push(nextPage)
            const nextPageButton = dom.window.document.getElementsByClassName('a-last').item(0)
            const nextPagePath = nextPageButton ? nextPageButton.firstChild.href : undefined
            if (nextPagePath != undefined) {
                nextPage = host + nextPagePath
            } else {
                hasNextPage = false
            }
        }
        return urls.length
    }

    /**
     * Get request with headless browser
     * @param {*} url 
     */
    async get(url) {
        const page = await this.browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });
        return await page.content();
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
        const preFixForDate = "Hat ein Produkt bewertet  · "


        const title = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > h1 > span > span", card).text();
        const stars = ($("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-mini > div > i", card).prop("class") || "").split(" ")
            .map((className) => this.ratingClassMap.indexOf(className))
            .find((index) => index > 0);

        const text = $("div:nth-child(2) > div.a-section.profile-at-content > a > div.a-section.a-spacing-none > p", card).text();
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