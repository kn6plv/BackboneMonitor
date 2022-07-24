
const Log = require("debug")("sitemonitor");
const Iperf3 = require("../test/Iperf3");
const Utils = require("../Utils");

const TICK = 60 * 60; // 1 hour

class SiteMonitor {

    constructor(site) {
        this.site = site;
    }

    async run() {
        for (;;) {
            try {
                const start = Date.now();

                // Monitor the speed of local links. These should always be full speed.
                await this.testLocalLinks();

                await Utils.sleep(TICK - (Date.now() - start) / 1000);
            }
            catch (e) {
                Log(e);
                break;
            }
        }
    }

    async testLocalLinks() {
        Log("testLocalLinks:");
        const root = await this.site.getRootNode();
        const nodes = await this.site.getNodes();
        const fails = {};
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].name !== root.name) {
                const test = new Iperf3({
                    client: root.name,
                    server: nodes[i].name
                });
                const results = await test.run();
                if (!results && !fails[nodes[i].name]) {
                    fails[nodes[i].name] = true;
                }
                else {
                    await root.updateLinkSpeed(nodes[i], results);
                }
            }
        }
    }

}

module.exports = SiteMonitor;
