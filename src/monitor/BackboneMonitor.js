
const Log = require("debug")("backbonemonitor");
const Iperf3 = require("../test/Iperf3");
const Utils = require("../Utils");

const TICK = 15 * 60; // 15 minutes
const TIMEOUT_NEIGHBOR = 10; // 10 minutes

class BackboneMonitor {

    constructor(backbone) {
        this.backbone = backbone;
    }

    async run() {
        await Utils.sleep(60);
        for (;;) {
            try {
                const start = Date.now();

                // Monitor the speed of backbone links. Speeds will vary.
                await this.testBackboneLinks();

                await Utils.sleep(TICK - (Date.now() - start) / 1000);
            }
            catch (e) {
                Log(e);
                break;
            }
        }
    }

    async testBackboneLinks() {
        Log("testBackboneLinks:");
        const links = await this.backbone.getSiteLinks();
        for (let i = 0; i < links.length; i++) {
            const neighborsA = await links[i].peerA.getNeighbor(links[i].peerB, TIMEOUT_NEIGHBOR);
            if (neighborsA.find(neighbor => neighbor.type == links[i].type)) {
                const testA = new Iperf3({
                    client: links[i].peerA.name,
                    server: links[i].peerB.name
                });
                await links[i].peerA.updateLinkSpeed(links[i].peerB, await testA.run());
            }
            else {
                // Link down
                await links[i].peerA.updateLinkSpeed(links[i].peerB, null);
            }
            const neighborsB = await links[i].peerB.getNeighbor(links[i].peerA, TIMEOUT_NEIGHBOR);
            if (neighborsB.find(neighbor => neighbor.type == links[i].type)) {
                const testB = new Iperf3({
                    client: links[i].peerB.name,
                    server: links[i].peerA.name
                });
                await links[i].peerB.updateLinkSpeed(links[i].peerA, await testB.run());
            }
            else {
                // Link down
                await links[i].peerB.updateLinkSpeed(links[i].peerA, null);
            }
        }
    }

}

module.exports = BackboneMonitor;
