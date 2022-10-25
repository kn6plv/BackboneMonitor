
const Log = require("debug")("db:site");
const DB = require("./Database");
const Node = require("./Node");

const db = DB.open({
    schema: [
        `CREATE TABLE IF NOT EXISTS site_nodes (site TEXT COLLATE NOCASE, node TEXT COLLATE NOCASE);` +
        `CREATE TABLE IF NOT EXISTS site_rootnode (site TEXT COLLATE NOCASE PRIMARY KEY ON CONFLICT REPLACE, node TEXT COLLATE NOCASE);`
    ]
});

class Site {

    constructor(name) {
        this.name = name;
    }

    async addNode(node) {
        await db.query(`INSERT INTO site_nodes (site, node) VALUES ("${this.name}", "${node.name}");`);
    }

    async removeNode(node) {
        await db.query(`DELETE FROM site_nodes WHERE site = "${this.name}" AND node = "${node.name}";`);
    }

    async addRootNode(node) {
        await db.query(`INSERT INTO site_rootnode (site, node) VALUES ("${this.name}", "${node.name}");`);
    }

    async getRootNode() {
        Log("RootNodes:");
        const root = await db.get(`SELECT node FROM site_rootnode WHERE site = "${this.name}";`);
        Log("root:", root);
        if (!root) {
            return null;
        }
        return Node.getNode(root.node);
    }

    async getNodes() {
        Log("getNodes:");
        const nonroots = await db.getAll(`SELECT node FROM site_nodes WHERE site = "${this.name}";`);
        return nonroots.map(nonroot => Node.getNode(nonroot.node));
    }

    async getNode(name) {
        return Node.getNode(name);
    }

    async getLocation() {
        Log("getLocation:");
        return await (await this.getRootNode()).getLocation();
    }

    async getHealth() {
        Log("getHealth:");
        const root = await this.getRootNode();
        const nodes = await this.getNodes();
        const healths = await Promise.all(nodes.map(async node => node.getHealth(root)));
        const uptime = healths.length ? healths.reduce((p, v) => Math.min(p, v.uptime), 100) : 0;
        const health = healths.reduce((p, v) => p !== "bad" && (p === "good" || v.health === "bad") ? v.health : p, "good");
        Log(healths);
        return {
            health: health,
            uptime: Math.round(uptime)
        }
    }

}

Site.getSite = function(name) {
    return new Site(name);
}

module.exports = Site;
