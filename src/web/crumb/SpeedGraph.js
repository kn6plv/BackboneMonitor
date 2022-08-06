
const Log = require("debug")("crumb:speedgraph");
const Utils = require("../../Utils");

const ONE_DAY = 1 * 24 * 60;

const HEIGHT = 150;
const WIDTH = 200;

class SpeedGraph {

    constructor(nameA, nameB, link) {
        this.nameA = nameA;
        this.nameB = nameB;
        this.link = link;
        this.results = null;
    }

    async _getResults() {
        if (!this.results) {
            this.results = await this.link.getBandwidthResults(ONE_DAY);
        }
        return this.results;
    }

    async data() {
        const bw = this.link.bandwidth;
        const results2 = await this._getResults();
        if (!results2) {
            return null;
        }
        return [{
            name: "s1",
            label: `${this.nameA} &larr; ${this.nameB}`,
            width: WIDTH,
            height: HEIGHT,
            data: results2[0].map(v => Math.max(0, 1 - v.bandwidth / bw))
        },{
            name: "s2",
            label: `${this.nameB} &larr; ${this.nameA}`,
            width: WIDTH,
            height: HEIGHT,
            data: results2[1].map(v => Math.max(0, 1 - v.bandwidth / bw))
        }];
    }

    async getAverages() {
        const results2 = await this._getResults();
        return results2 ? [
            results2[0].reduce((a, v) => a + v.bandwidth, 0) / (results2[0].length || 1),
            results2[1].reduce((a, v) => a + v.bandwidth, 0) / (results2[1].length || 1)
        ] : [];
    }

}

module.exports = SpeedGraph;
