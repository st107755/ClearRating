module.exports = class ReviewsStatistics {

    constructor(reviews) {
        this.reviews = reviews
    }

    totalAverage() {
        let totalStars = 0;
        let totalReviewCount = 0
        this.reviews.forEach(({ stars }) => {
            totalStars += stars;
            totalReviewCount++;
        })
        return totalStars / totalReviewCount
    }

    verifiedAverage() {
        let verifiedStars = 0;
        let verifedReviewCount = 0
        this.reviews.filter(({ isVerified }) => isVerified).forEach(({ stars }) => {
            verifiedStars += stars;
            verifedReviewCount++;
        });
        return verifiedStars / verifedReviewCount
    }

    totalStandartDeviation() {
        let variance = 0;
        const average = this.totalAverage();
        this.reviews.forEach(({stars}) => {
            variance += Math.pow(stars - average,2)
        })
       variance =  variance / this.reviews.length
        return this.squareRoot(variance)
    }

    verifiedStandartDeviation() {
        let variance = 0;
        const verifiedAverage = this.verifiedAverage()
        this.reviews.filter(({ isVerified }) => isVerified).forEach(({stars}) => {
            variance += Math.pow(stars - verifiedAverage,2)
        })
        variance = variance / this.reviews.filter(({ isVerified }) => isVerified).length
        return this.squareRoot(variance)
    }

    squareRoot(num){
        return Math.pow(num , 0.5)
    }

}