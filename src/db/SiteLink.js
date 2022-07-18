
const Log = require("debug")("db:sitelink");
const LinkSpeed = require("./LinkSpeed");
const Node = require("./Node");
const Utils = require("../Utils");

const PAST_BANDWIDTHS = 3 * 24 * 60; // 3 days

class SiteLink {

    constructor(peerA, peerB, type, bandwidth) {
        this.peerA = Node.getNode(peerA);
        this.peerB = Node.getNode(peerB);
        this.type = type;
        this.bandwidth = bandwidth;
    }

    async getHealth() {
        Log("getHealth:");

        const results2 = await this.getBandwidthResults(PAST_BANDWIDTHS);
        const results = results2[0].concat(results2[1]);
        const bandwidth = results.length ? results.reduce((p, v) => p + v.bandwidth, 0) / results.length : 0;
        const uptime = results.length ? Math.round(100 * results.reduce((p, v) => p + (v.bandwidth ? 1 : 0), 0) / results.length) : 0;
        Log(results, bandwidth, this.bandwidth, uptime);

        return {
            bandwidth: bandwidth,
            uptime: uptime,
            health: Utils.getHealthStatus(100 * bandwidth / this.bandwidth, uptime)
        };
    }

    async getBandwidthResults(past) {
        const links = [
            new LinkSpeed(this.peerA, this.peerB),
            new LinkSpeed(this.peerB, this.peerA)
        ];
        return await Promise.all(links.map(async link => await link.getResults(past)));
    }
}

SiteLink.getSiteLink = function(peerA, peerB, type, bandwidth) {
    return new SiteLink(peerA, peerB, type, bandwidth);
}

module.exports = SiteLink;
