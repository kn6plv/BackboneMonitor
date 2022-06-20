
const Log = require("debug")("crumb:backbone");
const Crumb = require("./Crumb");
const Backbone = require("../../db/Backbone");
const SiteLink = require("./SiteLink");

class CrumbBackbone extends Crumb {

    constructor() {
        super({ name: "" });
    }

    async html() {
        const selection = await this.getSelection();
        const selected = selection[0];
        this.name = selected.name;
        return this.Template.BackboneDisplay({
            path: `#${this.name}`,
            map: {
                dots: selected.sites.filter(site => site.location).map(site => {
                    return { l: site.location, h: site.health.health };
                }),
                lines: selected.links.map(link => {
                    return {
                        a: selected.sites.find(site => site.name == link.peerA).location,
                        b: selected.sites.find(site => site.name == link.peerB).location,
                        h: link.health.health
                    };
                })
            },
            info: selected
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
                this.pushCrumb("SiteLink", { name: selection[0], peerA: link[0], peerB: link[1] });
            }
            else {
                // Navigate to site
            }
        }
    }

    async getSelection() {
        const selection = [];
        const backbones = await Backbone.getAll();
        for (let i = 0; i < backbones.length; i++) {
            const backbone = backbones[i];
            const sites = await backbone.getSites();
            const selectedsites = [];
            for (let j = 0; j < sites.length; j++) {
                selectedsites.push({
                    name: sites[j].name,
                    location: await sites[j].getLocation(),
                    health: await sites[j].getHealth()
                });
            }
            const links = await backbone.getSiteLinks();
            const selectedlinks = [];
            for (let j = 0; j < links.length; j++) {
                selectedlinks.push({
                    peerA: (await links[j].peerA.getSite()).name,
                    peerB: (await links[j].peerB.getSite()).name,
                    health: await links[j].getHealth()
                });
            }
            selection.push({
                name: backbone.name,
                icon: await backbone.getIcon(),
                health: await backbone.getHealth(),
                sites: selectedsites,
                links: selectedlinks
            });
        }
        return selection;
    }
    
}

module.exports = CrumbBackbone;
