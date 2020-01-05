const Koa = require('koa');
const KoaRouter = require('koa-router');
const KoaBody = require('koa-body');

module.exports = new class WebServer {
    app = null;
    router = null;

    constructor() {
        this.app = new Koa();
        this.router = new KoaRouter();
    }

    async init() {
        this.app.use(KoaBody());
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());
        this.app.listen(3000);
    }
}();