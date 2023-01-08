
const Log = require("debug")("nodemonitor");
const Utils = require("../Utils");

const TIMEOUT_SYSINFO = 5;
const RETRY_SYSINFO = 1;
const DELAY_SYSINFO = 30;
const TICK = 5 * 60; // 5 minutes

class NodeMonitor {

    constructor(node) {
        this.node = node;
    }

    async run() {
        for (;;) {
            const start = Date.now();
            try {
                const sysinfo = await Utils.mark(this.node.name, async () => await Utils.fetchWithTimeoutAndRetry(`http://${this.node.name}:8080/cgi-bin/sysinfo.json?link_info=1&lqm=1`, "json", TIMEOUT_SYSINFO, RETRY_SYSINFO, DELAY_SYSINFO));
                if (sysinfo) {
                    await this.node.updateBasics(sysinfo);
                    await this.node.updateNeighbors(sysinfo);
                }
                await this.node.updateReachable({ reachable: !!sysinfo });
            }
            catch (e) {
                Log(e);
                await this.node.updateReachable({ reachable: false });
            }
            await Utils.sleep(TICK - (Date.now() - start) / 1000);
        }
    }

}

module.exports = NodeMonitor;
