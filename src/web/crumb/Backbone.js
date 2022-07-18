
const Log = require("debug")("crumb:backbone");
const Crumb = require("./Crumb");
const Backbone = require("../../db/Backbone");

class CrumbBackbone extends Crumb {

    constructor() {
        super();
    }

    get name() {
        return this.backbone.name;
    }

    async html() {
        this.backbone = (await Backbone.getAll())[0];
    
        const sites = (await Promise.all((await this.backbone.getSites()).map(async site => {
            return {
                name: site.name,
                location: await site.getLocation(),
                health: await site.getHealth()
            }
        }))).filter(site => site.location);
        const links = await Promise.all((await this.backbone.getSiteLinks()).map(async link => {
            return {
                peerA: (await link.peerA.getSite()).name,
                peerB: (await link.peerB.getSite()).name,
                health: await link.getHealth()
            }
        }));

        return this.Template.BackboneDisplay({
            path: `#${this.name}`,
            map: {
                dots: sites.filter(site => site.location).map(site => {
                    return { l: site.location, h: site.health, t: site.name, r: `#${this.name}#${site.name}` };
                }),
                lines: links.map(link => {
                    return {
                        a: sites.find(site => site.name == link.peerA).location,
                        b: sites.find(site => site.name == link.peerB).location,
                        h: link.health
                    };
                })
            },
            info: {
                name: this.backbone.name,
                icon: await this.backbone.getIcon(),
                health: await this.backbone.getHealth(),
                sites: sites,
                links: links
            }
        });
    }

    breadcrumbs() {
        return this.Template.Breadcrumbs({
            breadcrumbs: this.state.breadcrumbs
        });
    }

    async cmd_select(msg) {
        Log("cmd_select:", msg);
        const selection = this.stripPath(msg.value.path);
        Log(selection);
        if (selection && selection.length) {
            const link = selection[0].split("+");
            if (link.length === 2) {
                // Navigate to site link
                this.pushCrumb("SiteLink", { name: selection[0], link: await this.backbone.getSiteLink(link[0], link[1]) });
            }
            else {
                // Navigate to site
                this.pushCrumb("Site", { name: selection[0], site: await this.backbone.getSite(selection[0]) });
            }
        }
    }
    
}

module.exports = CrumbBackbone;
