const mpath = require('mpath');
const fs = require('fs');
const path = require('path');

module.exports = new class Config {
    _config = {};

    constructor() {
        const filePath = path.resolve(process.cwd(), "config.json");
        if (fs.existsSync(filePath)) {
            try {
                this._config = JSON.parse(fs.readFileSync(filePath, 'UTF-8'));
            } catch (e) {
                console.error("Failed to load config", e);
            }
        }
    }

    /**
     * @param path
     * @param defaultValue
     * @returns {{}}
     */
    get(path = null, defaultValue = undefined) {
        let value = this._config;
        if (path) {
            value = mpath.get(path, this._config);
            if (typeof value === "undefined") {
                value = defaultValue;
            }
        }
        return value;
    }
};