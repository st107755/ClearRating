const phantom = require('phantom');
//const puppeteer = require('puppeteer');
const jsdom = require("jsdom"); // Coverting in Html Documents
const puppeteer = require('puppeteer-extra')
const { JSDOM } = jsdom;

/*main()

async function main(){
    console.log(await (getUserReviews("https://www.amazon.de/gp/profile/amzn1.account.AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA")))
}*/

async function getUserReviews(link) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    await scrollPageToBottom(page)
    await page.screenshot({path: 'debug.png'});
    const metrics = await getMetrics(page)
    await browser.close();
    return metrics
}

async function getMetrics(page) {
    const reviewCount = await page.$$('.dashboard-desktop-stat-value')
    let usefullReviewsCount = -1
    let totalReviewsCount = -1
    if (reviewCount[0]) {
        usefullReviewsCount = await (await reviewCount[0].getProperty('innerText')).jsonValue();
    }
    if (reviewCount[1]) {
      totalReviewsCount = await (await reviewCount[1].getProperty('innerText')).jsonValue();
    } else {
        totalReviewsCount =  reviewCounter(await page.$$('.a-star-5, .a-star-4, .a-star-3, .a-star-2, .a-star-1'))
    }

    const userMetrics = {
        _5stars: reviewCounter(await page.$$('.a-star-5')),
        _4stars: reviewCounter(await page.$$('.a-star-4')),
        _3stars: reviewCounter(await page.$$('.a-star-3')),
        _2stars: reviewCounter(await page.$$('.a-star-2')),
        _1stars: reviewCounter(await page.$$('.a-star-1')),
        usefullReviewsCount: usefullReviewsCount,
        totalReviewsCount: totalReviewsCount
    }
    return userMetrics
}

function reviewCounter(reviews) {
    return Array.from(reviews).length
}

/**
 * Scrolling page to bottom based on Body element
 * @param {Object} page Puppeteer page object
 * @param {Number} scrollStep Number of pixels to scroll on each step
 * @param {Number} scrollDelay A delay between each scroll step
 * @returns {Number} Last scroll position
 */
async function scrollPageToBottom(page, scrollStep = 250, scrollDelay = 50) {
    const lastPosition = await page.evaluate(
        async (step, delay) => {
            const getScrollHeight = (element) => {
                const { scrollHeight, offsetHeight, clientHeight } = element
                return Math.max(scrollHeight, offsetHeight, clientHeight)
            }

            const position = await new Promise((resolve) => {
                let count = 0
                const intervalId = setInterval(() => {
                    const { body } = document
                    const availableScrollHeight = getScrollHeight(body)

                    window.scrollBy(0, step)
                    count += step

                    if (count >= availableScrollHeight) {
                        clearInterval(intervalId)
                        resolve(count)
                    }
                }, delay)
            })

            return position
        },
        scrollStep,
        scrollDelay,
    )
    return lastPosition
}
exports.getUserReviews = getUserReviews;