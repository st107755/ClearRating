
    const jsdom = require("jsdom"); // Coverting in Html Documents
    const phantom = require('phantom'); // Headless Browser
    const { JSDOM } = jsdom;

    main()

    async function main (){
    reviewUrls()

    }


    async function reviewUrls (){
    var host = 'https://www.amazon.de'
    var path = '/W%C3%BCnsch-Dir-Was-Wahrhaftigkeit-Chronik-ebook/dp/B07NDN48Y4/'
    var reviewPath = path.replace('/dp/','/product-reviews/')   
    var nextPage = host + reviewPath 
    var hasNextPage = true  
    var urls =  new Array();
    var reviewPages = new Array()
    while(hasNextPage){ 
    const firstPage = await get(nextPage)
    const dom = new JSDOM(firstPage);
    reviewPages.push(dom)
    urls.push(nextPage)
    const nextPagePath = dom.window.document.getElementsByClassName('a-last').item(0).firstChild.href
    if (nextPagePath != undefined){
    nextPage = host + nextPagePath
    }else {
        hasNextPage = false 
    }
    }
    return reviewPages
    }

    /**
     * Get request with headless browser
     * @param {*} url 
     */
    async function get (url){
        const instance = await phantom.create();
        const page = await instance.createPage();
        const frame = await page.open(url)
        const content = await page.property('content');
        return content
    }