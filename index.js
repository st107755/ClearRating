const AmazonCrawler = require('./lib/AmazonCrawler');
const DB = require('./lib/DbUtils');

(async () => {
    const crawler = new AmazonCrawler();
    const db = new DB();
    await crawler.init();

    const reviewerStatistics = await crawler.crawlProductReviews("B07GFC1RGW", 1, 1)
    console.log(JSON.stringify());
    await crawler.stop();
})();