
const Log = require("debug")("crumb:sitelink");
const Crumb = require("./Crumb");
const Utils = require("../../Utils");
const SpeedGraph = require("./SpeedGraph");

class SiteLink extends Crumb {

    constructor(config) {
        super();
        this.link = config.link;
    }

    get name() {
        return `${this.siteA.name}+${this.siteB.name}`;
    }

    async html() {
        this.siteA = await this.link.peerA.getSite();
        this.siteB = await this.link.peerB.getSite();

        const health = await this.link.getHealth();
        const healthA = await this.link.peerA.getHealth();
        const healthB = await this.link.peerB.getHealth();
        const locA = await this.siteA.getLocation();
        const locB = await this.siteB.getLocation();

        const graphs = new SpeedGraph(this);

        return this.Template.SiteLinkDisplay({
            path: this.path,
            map: {
                dots: [
                    { l: locA, h: healthA },
                    { l: locB, h: healthB }
                ],
                lines: [
                    { a: locA, b: locB, h: health }
                ]
            },
            info: {
                siteA: this.siteA.name,
                siteB: this.siteB.name,
                health: health,
                nodeA: { name: Utils.shortHostname(this.link.peerA.name), health: healthA },
                nodeB: { name: Utils.shortHostname(this.link.peerB.name), health: healthB },
                speed: {
                    mbps: this.link.bandwidth,
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
        else if (selection.length === 0) {
            this.updateCrumb()
        }
        else {
            // Navigate to site
            const site = await this.getBackbone().getSite(selection[0]);
            this.pushCrumb("Site", { site: site });
            if (selection.length > 1) {
                // Navigate to node at site
                this.pushCrumb("Node", { node: await site.getNode(selection[1]) });
            }
        }
    }

}

module.exports = SiteLink;
