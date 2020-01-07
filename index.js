const config = require('./lib/Config');
const AmazonCrawler = require('./lib/AmazonCrawler');
const db = require('./lib/DbUtils');
const webserver = require('./lib/Webserver');
const ReviewsStatistics = require('./lib/ReviewStatistics');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();
    await webserver.init();

    webserver.router.get('/productStatus/:productId', async (ctx) => {
        let {productId} = ctx.params;
        const product = await db.getProduct(productId);
        if (!product || product.reviews.length < 3) {
            return ctx.response.body = {
                crawled: false
            };
        }
        const statistics = new ReviewsStatistics(product.reviews);
        ctx.response.body = {
            crawled: true,
            statistics: statistics.statisticValues()
        };
    });

    webserver.router.post('/crawlProduct/:productId', async (ctx) => {
        let {productId} = ctx.params;
        crawler.crawlProductReviews(productId);
        ctx.response.body = "OK";
    });
    webserver.router.put('/crawlProduct', async (ctx) => {
        const {url} = ctx.request.body;
        const productId = /([A-Z0-9]{10})/gm.test(url) ? /([A-Z0-9]{10})/gm.exec(url)[1] : "";
        crawler.crawlProductReviews(productId);
        ctx.response.body = "OK";
    });

    //console.log(await crawler.crawlProductReviews("B01IA7N7CM"));

    /*
    const reviewerStatistics = await crawler.crawlProductReviews("B081V6J1KQ");
    reviewerStatistics.forEach(reviewer => {
        db.put(reviewer);
    });

    console.log("sucessfull");*/
})();