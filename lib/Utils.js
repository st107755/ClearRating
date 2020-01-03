module.exports.scrollToBottom = function (page) {
    return page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 500;

            const timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
};

module.exports.disableImages = async function (page) {
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort();
        } else {
            request.continue();
        }
    });
};

module.exports.covertToDate = function (dateString) {
    dateString = dateString.replace(/\s/g, '');
    const splitedDate = dateString.split(".")
    return new Date(splitedDate[2], getMonthInt(splitedDate[1]), splitedDate[0])

};

function getMonthInt(month) {
    switch (month) {
        case "Jan":
            return 1;
        case "Feb":
            return 2;
        case "März":
            return 3;
        case "Apr":
            return 4;
        case "Mai":
            return 5;
        case "Juni":
            return 6;
        case "Juli":
            return 7;
        case "Aug":
            return 8;
        case "Sept":
            return 9;
        case "Okt":
            return 10;
        case "Nov":
            return 11;
        case "Dez":
            return 12;
    }

}
