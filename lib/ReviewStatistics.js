const ss = require('simple-statistics');
const MAGIC_SKEWNESS = 1.96;

module.exports = class ReviewsStatistics {
    /**
     * @type {array<{stars: number, isVerified: boolean}>}
     */
    reviews = [];

    constructor(reviews) {
        this.reviews = reviews
    }

    /**
     * @returns {number}
     */
    totalAverage() {
        let totalStars = 0;
        let totalReviewCount = 0;
        this.reviews.forEach(({stars}) => {
            totalStars += stars;
            totalReviewCount++;
        });
        return totalStars / totalReviewCount
    }

    /**
     * @returns {number}
     */
    verifiedAverage() {
        let verifiedStars = 0;
        let verifiedReviewCount = 0;
        this.reviews.filter(({isVerified}) => isVerified).forEach(({stars}) => {
            verifiedStars += stars;
            verifiedReviewCount++;
        });
        return verifiedStars / verifiedReviewCount
    }

    /**
     * @returns {number}
     */
    totalStandardDeviation() {
        let variance = 0;
        const average = this.totalAverage();
        this.reviews.forEach(({stars}) => {
            variance += Math.pow(stars - average, 2)
        });
        variance = variance / this.reviews.length;
        return Math.sqrt(variance);
    }

    /**
     * @returns {number}
     */
    verifiedStandardDeviation() {
        let variance = 0;
        const verifiedAverage = this.verifiedAverage();
        const verifiedStars = this.reviews.filter(({isVerified}) => isVerified);
        verifiedStars.forEach(({stars}) => {
            variance += Math.pow(stars - verifiedAverage, 2)
        });
        variance = variance / verifiedStars.length;
        return Math.sqrt(variance);
    }

    /**
     * @param {number[]} values
     * @returns {boolean}
     */
    isNormalDistributed(values) {
        const skewness = ss.sampleSkewness(values);
        return skewness > -MAGIC_SKEWNESS && skewness < MAGIC_SKEWNESS;
    }

    /**
     * @param {number} verifiedAverage
     * @param {number} verifiedStandardDeviation
     * @returns {string}
     */
    minimumVerifiedStars(verifiedAverage, verifiedStandardDeviation) {
        return (verifiedAverage - 1.65 * verifiedStandardDeviation).toFixed(2);
    }

    /**
     * @param {array<number>} values
     * @returns {number}
     */
    averageOrNull(values) {
        if (values.length > 0) {
            return ss.mean(values);
        } else {
            return 0;
        }
    }

    /**
     * @param {number[]} values
     * @returns {number}
     */
    standardDeviation(values) {
        if (values.length > 0) {
            return ss.standardDeviation(values)
        } else {
            return 0;
        }
    }

    /**
     *
     * @returns {{average: number, verifiedAverage: number, isNormalDistributed: boolean, totalStandardDeviation: number, verifiedStandardDeviation: number, vineAverage: number, vineStandardDeviation: number}}
     */
    statisticValues() {
        const totalStars = this.reviews.map(({stars}) => stars);
        const verifiedStars = this.reviews.filter(x => x.isVerified).map(reviews => reviews.stars);
        const vineStars = this.reviews.filter(x => x.isVine).map(reviews => reviews.stars);

        return {
            isNormalDistributed: this.isNormalDistributed(verifiedStars),
            average: this.averageOrNull(totalStars),
            totalStandardDeviation: this.standardDeviation(totalStars),
            verifiedAverage: this.averageOrNull(verifiedStars),
            verifiedStandardDeviation: this.standardDeviation(verifiedStars),
            vineAverage: this.averageOrNull(vineStars),
            vineStandardDeviation: this.standardDeviation(vineStars)
        };
    }
};