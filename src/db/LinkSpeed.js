
const Log = require("debug")("db:link");
const DB = require("./Database");

const db = DB.open({
    schema: [
        `CREATE TABLE IF NOT EXISTS link_speedtest (timestamp TEXT, client TEXT COLLATE NOCASE, server TEXT COLLATE NOCASE, bandwidth REAL);`
    ]
});

class LinkSpeed {

    constructor(client, server) {
        this.client = client;
        this.server = server;
    }

    async getResults(pastMinutes) {
        Log("getResult:");
        return await db.getAll(
            `SELECT timestamp, bandwidth FROM link_speedtest WHERE client = "${this.client.name}" AND server = "${this.server.name}" AND timestamp > datetime("now", "-${pastMinutes} minutes") ORDER BY timestamp;`
        );
    }

    async addResult(result) {
        Log("addResult:", result);
        await db.query(
            `INSERT INTO link_speedtest (timestamp, client, server, bandwidth) VALUES(datetime("now"), "${this.client.name}", "${this.server.name}", ${result.bandwidth});`
        );
    }
    
}

module.exports = LinkSpeed;
