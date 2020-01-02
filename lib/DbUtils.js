const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

module.exports = class Db {
    constructor() {}
   /**  constructor() {
        MongoClient.connect(url, function (err, client) {
            this.url = 'mongodb://localhost:27017';
            this.dbName = 'clearReview';
            assert.equal(null, err);
            console.log("Connected successfully to server");
            this.db = client.db(dbName);
        })
    }*/
    async put(reviewer) {
        this.db.set(reviewer, "string val", redis.print);
    }
}