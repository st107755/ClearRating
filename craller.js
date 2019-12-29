const jsdom = require("jsdom"); // Coverting in Html Documents
const phantom = require('phantom'); // Headless Browser
const reviewApi = require('./reviewerCraller')
const { JSDOM } = jsdom;

const host = 'https://www.amazon.de'
main(host)

async function main(host) {
    const productReviewPages = await reviewPages(host)
    const profilePaths = await extractReviewers(productReviewPages, host)
    const reviewers = await getReviewersHistory(profilePaths)
    console.log()

    async function getReviewersHistory(profilePaths) {
        const reviewers = new Array()
        for (i = 0; i < profilePaths.length; i++) {
            reviewers.push(await reviewApi.getUserReviews(profilePaths[i]))
        }
        return reviewers
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

    async function reviewPages(host) {
        var path = '/Emilijana-Magie-Feenherzblüte-Chronik-Elfenprinzessin-ebook/dp/B07SM129K2'
        var reviewPath = path.replace('/dp/', '/product-reviews/')
        var nextPage = host + reviewPath
        var hasNextPage = true
        var urls = new Array();
        var reviewPages = new Array()
        while (hasNextPage) {
            const firstPage = await get(nextPage)
            const dom = new JSDOM(firstPage);
            reviewPages.push(dom)
            urls.push(nextPage)
            const nextPagePath = dom.window.document.getElementsByClassName('a-last').item(0).firstChild.href
            if (nextPagePath != undefined) {
                nextPage = host + nextPagePath
            } else {
                hasNextPage = false
            }
        }
        return reviewPages
    }

    /**
     * Get request with headless browser
     * @param {*} url 
     */
    async function get(url) {
        const instance = await phantom.create();
        const page = await instance.createPage();
        const frame = await page.open(url)
        const content = await page.property('content');
        return content
    }
}