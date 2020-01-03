const AmazonCrawler = require('./lib/AmazonCrawler');
const db = require('./lib/DbUtils');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();

    console.log(await crawler.crawlProductReviews("B076HQSW3V"));

    /*
    const reviewerStatistics = await crawler.crawlProductReviews("B081V6J1KQ");
    reviewerStatistics.forEach(reviewer => {
        db.put(reviewer);
    });

    console.log("sucessfull");*/
    await crawler.stop();
})();