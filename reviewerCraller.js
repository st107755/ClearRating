const phantom = require('phantom');
const puppeteer = require('puppeteer');
const jsdom = require("jsdom"); // Coverting in Html Documents
const { JSDOM } = jsdom;

main()

async function main(){
    const reviewObject = await getUserReviews('https://www.amazon.de/gp/profile/amzn1.account.AHPCV4NNKMYWLFT4AZECEAI7TJGA')
    console.log(reviewObject)
    console.log(reviewObject.usefullReviews)
}

async function getUserReviews(link) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    const metrics = await getMetrics(page)
    await browser.close();
    return metrics
}

async function getMetrics(page) {
const reviewCount = await page.$$('.dashboard-desktop-stat-value')
// console.log(await page.evaluate(reviewCount => reviewCount.innerText, reviewCount[0]));
// const innerSpan = await reviewCount[0].getProperties('.a-size-large')
const data1 = await (await reviewCount[0].getProperty('innerText')).jsonValue();
console.log(data1)

    const userMetrics = {
        _5stars: reviewCounter(await page.$$('.a-star-5')),
        _4stars: reviewCounter(await page.$$('.a-star-4')),
        _3stars: reviewCounter(await page.$$('.a-star-3')),
        _2stars: reviewCounter(await page.$$('.a-star-2')),
        _1stars: reviewCounter(await page.$$('.a-star-1')),
        usefullReviews: reviewCount[0],
        totalReviews: reviewCount[1]

    }
    return userMetrics
}

function reviewCounter (reviews){
return Array.from(reviews).length
}
