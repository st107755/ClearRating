const AmazonCrawler = require('./lib/AmazonCrawler');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();
    const profile = await crawler.crawlProfile("AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA");
    await crawler.stop();

    console.log("reviews: ", profile.reviewCount);
    console.log("average review: ", profile.averageReview);
})();