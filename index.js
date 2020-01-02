const AmazonCrawler = require('./lib/AmazonCrawler');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();
    /*const profile = await crawler.crawlProfile("AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA");

    console.log("reviews: ", profile.reviewCount);
    console.log("average review: ", profile.averageReview);*/
    const reviewerStatistics = await crawler.crawlProductReviews("B07GFC1RGW", 1, 1)
    console.log(JSON.stringify());
    await crawler.stop();
})();