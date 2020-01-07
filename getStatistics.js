const MongoClient = require('mongodb');
const assert = require('assert');
const ss = require('simple-statistics')


const url = 'mongodb://localhost:27017';
const dbName = 'clearReview';

main()

async function main() {

    const client = await new MongoClient(url);
    client.connect(async function connect(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        db = client.db(dbName);
        const productID = "B078FLBSQN";
        const statisticalValues = await statisticValues(productID);
        if (statisticValues.isNormalDistirubted){
        const minimumStars = minimumVerifiedStars(statisticalValues.verifedAverage, statisticalValues.verifedStandartDeviation);
        console.log("95% der Menschen die diese Produkt gekauft haben haben mindestens " + minimumStars + " Sterne vergeben")
        }else {
            console.log("There ist no normal Distibution in ")
        }
    
    });




}

function isNormalDistirubted(values) {
    const skewness = ss.sampleSkewness(values)
    return skewness > -1.96 && skewness < 1.96 
    
}

function minimumVerifiedStars(verifedAverage, verifedStandartDeviation) {
    return (verifedAverage - 1.65 * verifedStandartDeviation).toFixed(2);
}

async function statisticValues(productID) {
    const product = await db.collection('product').find({ "_id": productID }).toArray();
    const reviews = product.map(x => x.reviews)[0];

    const totalstars = reviews.map(reviews => reviews.stars);
    const verifiedStars = reviews.filter(x => x.isVerified).map(reviews => reviews.stars);
    const vineStars = reviews.filter(x => x.isVine).map(reviews => reviews.stars);

    const isNormal = isNormalDistirubted(verifiedStars);
    const average = averageOrNull(totalstars);
    const totalStandartDeviation = standardDeviation(totalstars);
    const verifedAverage = averageOrNull(verifiedStars);
    const verifedStandartDeviation = standardDeviation(verifiedStars);
    const vineAverage = averageOrNull(vineStars);
    const vineStandartDeviation = standardDeviation(vineStars);

    return {
        isNormalDistributed: isNormal,
        average: average,
        totalStandartDeviation: totalStandartDeviation,
        verifedAverage: verifedAverage,
        verifedStandartDeviation: verifedStandartDeviation,
        vineAverage: vineAverage,
        vineStandartDeviation: vineStandartDeviation
    };

    function averageOrNull(values) {
        if (values.length > 0) {
            return ss.mean(verifiedStars);
        }
        else {
            return 0;
        }
        ;
    }
    function standardDeviation(values) {
        if (values.length > 0) {
            return ss.standardDeviation(values)
        } else {
            return 0;
        }
    }
}

