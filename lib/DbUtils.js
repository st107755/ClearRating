const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'clearReview';
let db = null ;

module.exports = class Db {

    constructor() {
        MongoClient.connect(url, function (err, client) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
             db = client.db(dbName);
        })
    }
    async put(reviewer) {
        db.collection("reviewers").insertOne(reviewer);
    }
}