
const Log = require("debug")("db:node");
const HtmlEntities = require("html-entities")
const DB = require("./Database");
const LinkSpeed = require("./LinkSpeed");
const NodeReachable = require("./NodeReachable");
const Utils = require("../Utils");
let Site;

const PAST_REACHABLE = 24 * 60; // 24 hours
const PAST_BANDWIDTHS = 24 * 60; // 24 hours

const DEFAULT_BANDWIDTH = 80;

const db = DB.open({
    schema: [
        `CREATE TABLE IF NOT EXISTS nodes_basics (timestamp TEXT, name TEXT COLLATE NOCASE PRIMARY KEY ON CONFLICT REPLACE, description TEXT, lat REAL, lon REAL, hardware TEXT, firmware TEXT, mac TEXT, ssid TEXT, channel INT, frequency INT, bandwidth INT);`,
        `CREATE TABLE IF NOT EXISTS nodes_neighbors (timestamp TEXT, key TEXT PRIMARY KEY ON CONFLICT REPLACE, name TEXT COLLATE NOCASE, neighbor TEXT COLLATE NOCASE, type TEXT)`
    ]
});

class Node {

    constructor(name) {
        if (!Site) {
            Site = require("./Site");
        }
        this.name = name;
        this.bandwidth = DEFAULT_BANDWIDTH;
    }

    async getName() {
        return this.name;
    }

    async getSite() {
        const site = await db.get(`SELECT site FROM site_nodes WHERE node = "${this.name}";`);
        if (!site) {
            return null;
        }
        return Site.getSite(site.site);
    }

    async getLocation() {
        return await db.get(`SELECT lat, lon FROM nodes_basics WHERE name = "${this.name}";`);
    }

    async getNeighbor(node, pastMinutes) {
        Log("getNeighbor:");
        const n = await db.getAll(`SELECT type FROM nodes_neighbors WHERE name = "${this.name}" AND neighbor = "${node.name}" AND timestamp > datetime("now", "-${pastMinutes} minutes");`);
        Log(n);
        return n;
    }

    async getHealth() {
        const reach = new NodeReachable(this);
        const results = await reach.getResults(PAST_REACHABLE);
        const uptime = Math.round(100 * (results.length ? results.reduce((p, v) => p + (v.reachable ? 1 : 0), 0) / results.length : 0));

        const root = await (await this.getSite()).getRootNode();

        if (this.name === root.name) {
            return {
                bandwidth: this.bandwidth,
                uptime: uptime,
                health: Utils.getHealthStatus(100, uptime)
            };
        }

        const bresults2 = await this.getBandwidthResults(PAST_BANDWIDTHS);
        const bresults = bresults2[0].concat(bresults2[1]);
        const bandwidth = bresults.length ? bresults.reduce((p, v) => p + v.bandwidth, 0) / bresults.length : 0;
        
        return {
            bandwidth: bandwidth,
            uptime: uptime,
            health: Utils.getHealthStatus(bandwidth, uptime)
        };
    }

    async getBandwidthResults(past) {
        const root = await (await this.getSite()).getRootNode();
        if (root.name == this.name) {
            return null;
        }
        const links = [
            new LinkSpeed(root, this),
            new LinkSpeed(this, root)
        ];
        return await Promise.all(links.map(async link => await link.getResults(past)));
    }

    async getBasics() {
        return await db.get(
            `SELECT description, hardware, firmware, mac, ssid, channel, frequency, bandwidth FROM nodes_basics WHERE name = "${this.name}";`
        );
    }

    async updateBasics(sysinfo) {
        let freq = sysinfo.meshrf.freq || "0";
        if (freq.indexOf("GHz") !== -1) {
            freq = parseFloat(freq) * 1000;
        }
        await db.query(
            `INSERT INTO nodes_basics (timestamp, name, description, lat, lon, hardware, firmware, mac, ssid, channel, frequency, bandwidth) VALUES(datetime("now"),"${this.name}", "${HtmlEntities.decode(sysinfo.node_details.description)}", ${sysinfo.lat || 0}, ${sysinfo.lon || 0}, "${sysinfo.node_details.model}", "${sysinfo.node_details.firmware_version}", "-", "${sysinfo.meshrf.ssid || "OFF"}", ${sysinfo.meshrf.channel || 0}, ${freq}, ${sysinfo.meshrf.chanbw || 0});`
        );
    }

    async updateNeighbors(sysinfo) {
        Log("updateNeighbors:");
        if (sysinfo.lqm && sysinfo.link_info) {
            for (let ip in sysinfo.link_info) {
                const link = sysinfo.link_info[ip];
                const key = `${this.name}/${ip}/${link.linkType || "DTD"}`;
                await db.query(
                    `INSERT INTO nodes_neighbors (timestamp, key, name, neighbor, type) VALUES(datetime("now"), "${key}", "${this.name}", "${Utils.canonicalHostname(link.hostname) || ""}", "${link.linkType || "DTD"}")`
                );
            }
        }
        if (sysinfo.lqm && sysinfo.lqm.enabled) {
            for (let mac in sysinfo.lqm.info.trackers) {
                const tracker = sysinfo.lqm.info.trackers[mac];
                const key = `${this.name}/${tracker.ip}/${tracker.type || "RF"}`;
                await db.query(
                    `INSERT INTO nodes_neighbors (timestamp, key, name, neighbor, type) VALUES(datetime("now"), "${key}", "${this.name}", "${Utils.canonicalHostname(tracker.hostname) || ""}", "${tracker.type || "RF"}")`
                );
            }
        }
    }

    async updateLinkSpeed(linkNode, result) {
        Log(this.name, linkNode.name, result);
        const link = new LinkSpeed(this, linkNode);
        await link.addResult(result ? result : { bandwidth: 0 });
    }

    async updateReachable(reachable) {
        const reach = new NodeReachable(this);
        await reach.addResult(reachable);
    }

}

Node.getNode = function(name) {
    return new Node(Utils.canonicalHostname(name));
}

module.exports = Node;
