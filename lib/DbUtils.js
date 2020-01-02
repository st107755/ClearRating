var redis = require('redis');

module.exports = class DbUtils {

    constructor(file) {
        this.isConnected = false 
        this.client = redis.createClient(6379, '127.0.0.1');
        this.client.on('connect', function() {
           this.isConnected = true 
        });
    }

    async put(reviewer){
        client.set(reviewer, "string val", redis.print);
    }
}