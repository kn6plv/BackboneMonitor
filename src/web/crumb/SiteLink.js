
const Log = require("debug")("crumb:sitelink");
const Crumb = require("./Crumb");
const Backbone = require("../../db/Backbone");
const Site = require("../../db/Site");
const Utils = require("../../Utils");

class SiteLink extends Crumb {

    constructor(config) {
        super(config);
        this.siteA = config.peerA;
        this.siteB = config.peerB;
    }

    async html() {
        const backbone = (await Backbone.getAll())[0];

        const link = await backbone.getSiteLink(this.siteA, this.siteB);
        const siteA = Site.getSite(this.siteA);
        const siteB = Site.getSite(this.siteB);

        const health = await link.getHealth();
        const locA = await siteA.getLocation();
        const locB = await siteB.getLocation();
        const rootA = await siteA.getRootNode();
        const rootB = await siteB.getRootNode();

        return this.Template.SiteLinkDisplay({
            path: this.path,
            map: {
                dots: [
                    { l: locA, h: (await siteA.getHealth()).health },
                    { l: locB, h: (await siteB.getHealth()).health }
                ],
                lines: [
                    { a: locA, b: locB, h: health.health }
                ]
            },
            info: {
                siteA: this.siteA,
                siteB: this.siteB,
                health: health,
                nodeA: { name: Utils.shortHostname(link.peerA.name), health: await link.peerA.getHealth(rootA) },
                nodeB: { name: Utils.shortHostname(link.peerB.name), health: await link.peerB.getHealth(rootB) }
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

module.exports = SiteLink;
