'use strict';

class ClearRating {
    reviews = [];

    constructor() {
        this.initObserver();
        this.loadReviewData();
    }

    initObserver() {
        const reviewListElement = document.querySelector('#cm_cr-review_list');
        const observer = new MutationObserver(this.loadReviewData.bind(this));
        observer.observe(reviewListElement, {childList: true, characterData: true});
    }

    getSearchParams() {
        return Object.fromEntries(
            window.location.search
                .replace("?", "")
                .split("&")
                .map((param) => param.split("="))
        );
    }

    loadReviewData() {
        const searchParams = this.getSearchParams();
        $.get("http://localhost:3000/productReviews/B07TWFWJDZ/?page=" + (searchParams.pageNumber || 1)).then((data) => {
            this.reviews = this.reviews.concat(data);
            this.updateReviews();
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