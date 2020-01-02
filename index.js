const AmazonCrawler = require('./lib/AmazonCrawler');

(async () => {
    const crawler = new AmazonCrawler(null, {
        api: true
    });
    await crawler.init();
    /*const profile = await crawler.crawlProfile("AFJWQ5SKSQ7H4OCHVMGZSPGUBGTA");

    console.log("reviews: ", profile.reviewCount);
    console.log("average review: ", profile.averageReview);*/
    /*const reviewerStatistics = await crawler.crawlProductReviews("B07TWFWJDZ", 1, 1)
    console.log(JSON.stringify(reviewerStatistics, null, 4));
    await crawler.stop();*/
})();