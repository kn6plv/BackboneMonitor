
const Log = require("debug")("crumb:speedgraph");
const Utils = require("../../Utils");

const ONE_DAY = 1 * 24 * 60;

const HEIGHT = 150;
const WIDTH = 200;

class SpeedGraph {

    constructor(sitelink) {
        this.sitelink = sitelink;
        this.results = null;
    }

    async _getResults() {
        if (!this.results) {
            this.results = await this.sitelink.link.getBandwidthResults(ONE_DAY);
        }
        return this.results;
    }

    async data() {
        const bw = this.sitelink.link.bandwidth;
        const results2 = await this._getResults();
        return [{
            name: "s1",
            label: `${this.sitelink.siteA.name} &larr; ${this.sitelink.siteB.name}`,
            width: WIDTH,
            height: HEIGHT,
            data: results2[0].map(v => Math.max(0, 1 - v.bandwidth / bw))
        },{
            name: "s2",
            label: `${this.sitelink.siteB.name} &larr; ${this.sitelink.siteA.name}`,
            width: WIDTH,
            height: HEIGHT,
            data: results2[1].map(v => Math.max(0, 1 - v.bandwidth / bw))
        }];
    }

    async getAverages() {
        const results2 = await this._getResults();
        return [
            results2[0].reduce((a, v) => a + v.bandwidth, 0) / (results2[0].length || 1),
            results2[1].reduce((a, v) => a + v.bandwidth, 0) / (results2[1].length || 1)
        ];
    }

}

module.exports = SpeedGraph;
