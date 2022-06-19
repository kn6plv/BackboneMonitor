
const Log = require("debug")("monitor");
const WorkerThreads = require("worker_threads");
const Backbone = require("../db/Backbone");
const BackboneMonitor = require("./BackboneMonitor");
const NodeMonitor = require("./NodeMonitor");
const SiteMonitor = require("./SiteMonitor");

const BACKGROUND = false;

//
// Create a backbone monitor for all the backbones,
// a site monitor for all sites on all backbones,
// and a node monitor for all the nodes at the sites.
//
async function monitorAll() {

    Log("monitorAll:");
    const backbones = await Backbone.getAll();
    Log(backbones);

    for (let i = 0; i < backbones.length; i++) {

        const monitor = new BackboneMonitor(backbones[i]);
        monitor.run().catch(e => Log(e));

        const sites = await backbones[i].getSites();
        for (let j = 0; j < sites.length; j++) {
            const monitor = new SiteMonitor(sites[j]);
            monitor.run().catch(e => Log(e));

            const nodes = await sites[j].getNodes();
            for (let k = 0; k < nodes.length; k++) {
                const monitor = new NodeMonitor(nodes[k]);
                monitor.run().catch(e => Log(e));
            }
        }

    }
}

module.exports = {
    run: function() {
        // This runs on another thread
        if (BACKGROUND && WorkerThreads.isMainThread) {
            Log(__filename);
            const worker = new WorkerThreads.Worker(__filename);
            worker.on("exit", code => {
                Log("exit:", code);
            });
        }
        else {
            monitorAll().catch(e => Log(e));
        }
    }
};

if (process.argv[1] === __filename) {
    module.exports.run();
}
