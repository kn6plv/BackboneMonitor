
const Log = require("debug")("test:ping");
const Utils = require("../Utils");


class Ping {

    constructor(config) {
        this.client = config.client;
        this.timeout = config.timeout || (5 * 1000);
    }

    async run() {
        Log(`run: ping ${this.client}`);
        return await Utils.mark(this.client, async () => {
            // ...
        });
    }
}

module.exports = Ping;
