const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'clearReview';
let db = null;

module.exports = new class Db {
    constructor() {
        MongoClient.connect(url, function (err, client) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            db = client.db(dbName);
        })
    }

    async putReviewer(reviewer) {
        try {
            return db.collection("reviewers").insertOne(reviewer, {forceServerObjectId: false});
        } catch (e) {
            console.error("error putting reviewer", reviewer, e);
        }
    }

    async hasReviewer(reviewerId) {
        return !!await db.collection("reviewers").findOne({_id: reviewerId});
    }

    async getReviewer(reviewerId) {
        return db.collection("reviewers").findOne({_id: reviewerId});
    }

    async putProduct(profile) {
        return db.collection("product").insertOne(profile, {forceServerObjectId: false});
    }

    async hasProduct(profileId) {
        return !!await db.collection("product").findOne({_id: profileId});
    }

    async getProduct(profileId) {
        return db.collection("product").findOne({_id: profileId});
    }
}();