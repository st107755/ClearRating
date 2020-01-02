// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.amazon.de/product-reviews/*/*
// @require      https://code.jquery.com/jquery-latest.js
// @grant        none
// ==/UserScript==

let reviews = [];

function getSearchParams() {
    return Object.fromEntries(window.location.search.replace("?", "").split("&").map((param) => param.split("=")));
}

function loadMetrics() {
    const queryParams = getSearchParams();
    $.get("http://localhost:3000/productReviews/B07TWFWJDZ/?page=" + (queryParams.pageNumber || 1)).then((data) => {
        reviews = reviews.concat(data);
        updateReviews();
    });
}

function updateReviews() {
    for (let review of reviews) {
        const reviewElement = $("#" + review.id + ", #viewpoint-" + review.id);
        $(".a-profile-content > span, .a-profile-name", reviewElement).html(
            review.account.name +
            "<br>" +
            "<small>" +
            ` ● ${review.account.reviewCount || 0}` +
            ` ✰ ${(review.account.verifiedAverage || 0).toFixed(2)}` +
            ` ☆ ${(review.account.totalAverage || 0).toFixed(2)}` +
            "</small>"
        );
    }
}

(function() {
    // broken :( works only on first load
    $("ul.a-pagination > li > a").on("click", () => {
        setTimeout(() => {
            loadMetrics();
        }, 400)
    });

    loadMetrics();
})();