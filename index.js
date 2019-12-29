const AmazonCrawler = require('./lib/AmazonCrawler');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();
    /*const profile = await crawler.crawlProfile("AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA");

    console.log("reviews: ", profile.reviewCount);
    console.log("average review: ", profile.averageReview);*/
    console.log(JSON.stringify(await crawler.crawlProductReviews("B00Y211AFM", 1, 1), null, 4));
    await crawler.stop();
})();