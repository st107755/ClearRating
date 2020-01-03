const AmazonCrawler = require('./lib/AmazonCrawler');
const db = require('./lib/DbUtils');

const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaBody = require('koa-body');

(async () => {
    const crawler = new AmazonCrawler();
    await crawler.init();

    const app = new Koa();
    const router = new KoaRouter();

    router.put('/crawlProduct', async (ctx) => {
        const {url} = ctx.request.body;
        const productId =  /([A-Z0-9]{10})/gm.test(url) ? /([A-Z0-9]{10})/gm.exec(url)[1] : "";
        crawler.crawlProductReviews(productId);
        ctx.response.body = "lul";
    });

    app.use(KoaBody());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.listen(3000);

    //console.log(await crawler.crawlProductReviews("B01IA7N7CM"));

    /*
    const reviewerStatistics = await crawler.crawlProductReviews("B081V6J1KQ");
    reviewerStatistics.forEach(reviewer => {
        db.put(reviewer);
    });

    console.log("sucessfull");*/
})();