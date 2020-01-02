'use strict';

class ClearRating {
    reviews = [];
    isLoading = false;

    constructor() {
        this.initObserver();
        this.loadReviewData();

        if (window.location.toString().indexOf("/dp/") !== -1) {
            this.loadProductOverview();
        }
    }

    initObserver() {
        const reviewListElement = document.querySelector('#cm_cr-review_list');
        if (reviewListElement) {
            const observer = new MutationObserver(this.loadReviewData.bind(this));
            observer.observe(reviewListElement, {childList: true, characterData: true});
        }
    }

    getSearchParams() {
        return Object.fromEntries(
            window.location.search
                .replace("?", "")
                .split("&")
                .map((param) => param.split("="))
        );
    }

    async loadProductOverview() {
        const reviews = $('[data-hook="review"]');
        for (let i = 0; i < reviews.length; i++) {
            const element = reviews[String(i)];
            const href = $('.a-profile', element).prop("href");
            const accountId = /([A-Z0-9]{28})/gm.test(href) ? /([A-Z0-9]{28})/gm.exec(href)[1] : "";
            const account = await this.loadAccountData(accountId);
            $(".a-profile-content > span, .a-profile-name", element).html(
                `${account.name}<br>
                    <small>
                        ● ${account.reviewCount || 0} 
                        ✰ ${(account.verifiedAverage || 0).toFixed(2)} 
                        ☆ ${(account.totalAverage || 0).toFixed(2)}
                    </small>`
            );
        }
    }

    loadReviewData() {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;

        const searchParams = this.getSearchParams();
        const articleHref = window.location.toString();
        const articleId = /([A-Z0-9]{10})/gm.test(articleHref) ? /([A-Z0-9]{10})/gm.exec(articleHref)[1] : "";
        $.get("https://metztli.duckdns.org/productReviews/" + articleId + "/?page=" + (searchParams.pageNumber || 1)).then((data) => {
            this.reviews = this.reviews.concat(data);
            this.updateReviews();
            this.isLoading = false;
        });
    }

    loadAccountData(accountId) {
        return new Promise((resolve, reject) => {
            $.get("http://localhost:3000/accountMetrics/" + accountId).then(resolve);
        });
    }

    updateReviews() {
        for (let review of this.reviews) {
            const reviewElement = $("#" + review.id + ", #viewpoint-" + review.id);
            $(".a-profile-content > span, .a-profile-name", reviewElement).html(
                `${review.account.name}<br>
                <small>
                    ● ${review.account.reviewCount || 0} 
                    ✰ ${(review.account.verifiedAverage || 0).toFixed(2)} 
                    ☆ ${(review.account.totalAverage || 0).toFixed(2)}
                </small>`
            );
        }
    }
}

new ClearRating();