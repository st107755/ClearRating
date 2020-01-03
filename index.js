const AmazonCrawler = require('./lib/AmazonCrawler');
const DB = require('./lib/DbUtils');

(async () => {
    const crawler = new AmazonCrawler();
    const db = new DB();
    await crawler.init();

    const reviewerStatistics = await crawler.crawlProductReviews("B081V6J1KQ");
    reviewerStatistics.forEach(reviewer => {
        db.put(reviewer);
    });

    console.log("sucessfull");
    await crawler.stop();
})();