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
        return db.collection("reviewers").insertOne(reviewer, {forceServerObjectId: false});
    }

    async putProfile(profile) {
        return db.collection("profiles").insertOne(profile, {forceServerObjectId: false});
    }
}();