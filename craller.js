
const jsdom = require("jsdom"); // Coverting in Html Documents
const phantom = require('phantom'); // Headless Browser
const { JSDOM } = jsdom;

main()

async function main() {
  getReviewersHistory(await extractReviewers(await reviewPages()))


}

async function getReviewersHistory(profilePaths){

}

async function extractReviewers(reviewPages) {
    var profilesPath = new Array()
    for (i = 0; i < reviewPages.length; i++) { 
        const page = reviewPages[i]
        const profiles = Array.from(page.window.document.getElementsByClassName('a-profile'))
        for (j = 0; j < profiles.length; j ++) {
            const profile = profiles[j]
            profilesPath.push(profile.href)
        }
    }
    return profilesPath

}

async function reviewPages() {
    var host = 'https://www.amazon.de'
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