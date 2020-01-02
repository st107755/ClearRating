module.exports.scrollToBottom = function (page) {
    return page.evaluate(async () => {
        let resolved = false;
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!resolved) {
                    resolve();
                }
            }, 1000 * 60);

            let totalHeight = 0;
            let distance = 500;

            const timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolved = true;
                    resolve();
                }
            }, 100);
        });
    });
};