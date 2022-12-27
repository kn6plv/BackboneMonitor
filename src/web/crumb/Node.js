
const Log = require("debug")("crumb:site");
const Crumb = require("./Crumb");
const Utils = require("../../Utils");
const SpeedGraph  = require("./SpeedGraph");

class Node extends Crumb {

    constructor(config) {
        super(config);
        this.node = config.node;
    }

    get name() {
        return Utils.shortHostname(this.node.name);
    }

    async html() {
        const site = await this.node.getSite();
        const health = await this.node.getHealth();
        const basics = await this.node.getBasics();
        const location = await site.getLocation();
        const root = await site.getRootNode();

        let graphs;
        if (Utils.equalStringIgnoreCase(root.name, this.node.name)) {
            // We dont have any bandwidth graphs from the root node to itself, so
            // we pick an alternative site node and use it's value (but flipped).
            graphs = new SpeedGraph(this.name, site.name, {
                bandwidth: this.node.bandwidth,
                getBandwidthResults: async (past) => {
                    const sitenodes = await site.getNodes();
                    const altnode = sitenodes.find(n => n.name !== this.node.name);
                    if (altnode) {
                        const r = await altnode.getBandwidthResults(past);
                        return [ r[1], r[0] ];
                    }
                    else {
                        return await this.node.getBandwidthResults(past);
                    }
                }
            });
        }
        else {
            graphs = new SpeedGraph(this.name, site.name, this.node);
        }

        return this.Template.NodeDisplay({
            path: this.path,
            map: {
                dots: [{
                    l: location,
                    h: health
                }],
                lines: []
            },
            info: {
                node: this.name,
                health: health,
                basics: basics,
                avgs: (await graphs.getAverages()).map(v => v.toFixed(2)),
                speed: {
                    mbps: 80,
                    graphs: await graphs.data()
                }
            }
        });
    }

    async cmd_select(msg) {
        Log("cmd_select:", msg);
        const selection = this.stripPath(msg.value.path);
        Log(selection);
        if (!selection) {
            this.popCrumb();
        }
    }

}

module.exports = Node;
