
const Log = require("debug")("crumb:site");
const Crumb = require("./Crumb");
const Utils = require("../../Utils");

class Node extends Crumb {

    constructor(config) {
        super(config);
        this.node = config.node;
    }

    get name() {
        return Utils.shortHostname(this.node.name);
    }

    async html() {
        const health = await this.node.getHealth();
        const basics = await this.node.getBasics();
        let location = await this.node.getLocation();
        if (!location) {
            location = await (await this.node.getSite()).getLocation();
        }
        location = await (await this.node.getSite()).getLocation();

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
                basics: basics
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
