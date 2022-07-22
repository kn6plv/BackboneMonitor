
const Log = require("debug")("db:sitelink");
const LinkSpeed = require("./LinkSpeed");
const Node = require("./Node");
const Utils = require("../Utils");

const PAST_BANDWIDTHS_UPTIME = 3 * 24 * 60; // 3 days
const PAST_BANDWIDTHS = 6 * 60; // 6 hours

class SiteLink {

    constructor(peerA, peerB, type, bandwidth) {
        this.peerA = Node.getNode(peerA);
        this.peerB = Node.getNode(peerB);
        this.type = type;
        this.bandwidth = bandwidth;
    }

    async getHealth() {
        Log("getHealth:");

        const bresults2 = await this.getBandwidthResults(PAST_BANDWIDTHS);
        const bresults = bresults2[0].concat(bresults2[1]);
        const bandwidth = bresults.length ? bresults.reduce((p, v) => p + v.bandwidth, 0) / bresults.length : 0;

        const uresults2 = await this.getBandwidthResults(PAST_BANDWIDTHS_UPTIME);
        const uresults = uresults2[0].concat(uresults2[1]);
        const uptime = uresults.length ? Math.round(100 * uresults.reduce((p, v) => p + (v.bandwidth ? 1 : 0), 0) / uresults.length) : 0;
        Log(uresults, bandwidth, this.bandwidth, uptime);

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
