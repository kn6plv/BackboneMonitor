
const Log = require("debug")("web:main");
const Template = require("./Template");
const Backbone = require("../db/Backbone");

async function HTML(ctx) {
    Log("loading:");
    Template.load();
    const selection = await getSelection();
    const selected = selection[0];
    ctx.body = Template.Main({
        selection: selection,
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
        selected: selected
    });
    ctx.type = "text/html";
}

async function WS(ctx) {
}

async function getSelection() {
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

module.exports = {
    HTML: HTML,
    WS: WS
};
