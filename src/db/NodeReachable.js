
const Log = require("debug")("db:reachable");
const DB = require("./Database");

const db = DB.open({
    schema: [
        `CREATE TABLE IF NOT EXISTS node_reachable (timestamp TEXT, node TEXT COLLATE NOCASE, reachable BOOL);`
    ]
});

class NodeReachable {

    constructor(node) {
        this.node = node;
    }

    async getResults(pastMinutes) {
        Log("getResult:");
        return await db.getAll(
            `SELECT timestamp, reachable FROM node_reachable WHERE node = "${this.node.name}" AND timestamp > datetime("now", "-${pastMinutes} minutes") ORDER BY timestamp;`
        );
    }

    async addResult(result) {
        Log("addResult:", result);
        await db.query(
            `INSERT INTO node_reachable (timestamp, node, reachable) VALUES(datetime("now"), "${this.node.name}", ${result.reachable});`
        );
    }
    
}

module.exports = NodeReachable;
