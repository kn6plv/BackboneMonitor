
const Log = require("debug")("nodemonitor");
const Utils = require("../Utils");

const TIMEOUT_SYSINFO = 5;
const RETRY_SYSINFO = 1;
const TICK = 5 * 60; // 5 minutes

class NodeMonitor {

    constructor(node) {
        this.node = node;
    }

    async run() {
        for (;;) {
            try {
                const start = Date.now();

                const sysinfo = await Utils.mark(this.node.name, async () => await Utils.fetchWithTimeoutAndRetry(`http://${this.node.name}:8080/cgi-bin/sysinfo.json?link_info=1&lqm=1`, "json", TIMEOUT_SYSINFO, RETRY_SYSINFO));
                if (sysinfo) {
                    await this.node.updateBasics(sysinfo);
                    await this.node.updateNeighbors(sysinfo);
                    await this.node.updateReachable({ reachable: true });
                }
                else {
                    await this.node.updateReachable({ reachable: false });
                }

                await Utils.sleep(TICK - (Date.now() - start) / 1000);
            }
            catch (e) {
                Log(e);
                break;
            }
        }
    }

}

module.exports = NodeMonitor;
