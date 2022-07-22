
const Log = require("debug")("backbone");
const DB = require("./Database");
const Site = require("./Site");
const SiteLink = require("./SiteLink");

const db = DB.open({
    schema: [
        `CREATE TABLE IF NOT EXISTS backbone (backbone TEXT COLLATE NOCASE PRIMARY KEY ON CONFLICT REPLACE, icon TEXT);` +
        `CREATE TABLE IF NOT EXISTS backbone_sites (backbone TEXT COLLATE NOCASE, site TEXT COLLATE NOCASE);` +
        `CREATE TABLE IF NOT EXISTS backbone_links (backbone TEXT COLLATE NOCASE, peerA TEXT COLLATE NOCASE, peerB TEXT COLLATE NOCASE, type TEXT, bandwidth REAL);`
    ]
});

class Backbone {

    constructor(name) {
        this.name = name;
    }

    async addIcon(icon) {
        await db.query(`INSERT INTO backbone (backbone, icon) VALUES("${this.name}", "${icon}");`);
    }

    async addSite(site) {
        await db.query(`INSERT INTO backbone_sites (backbone, site) VALUES("${this.name}", "${site.name}");`);
    }

    async addSiteLink(peerA, peerB, type, bandwidth) {
        await db.query(`INSERT INTO backbone_links (backbone, peerA, peerB, type, bandwidth) VALUES("${this.name}", "${peerA.name}", "${peerB.name}", "${type}", ${bandwidth});`);
    }

    async getIcon() {
        const icon = await db.get(`SELECT icon FROM backbone WHERE backbone = "${this.name}";`);
        if (!icon) {
            return null;
        }
        return icon.icon;
    }

    async getSites() {
        const sites = await db.getAll(`SELECT site FROM backbone_sites WHERE backbone = "${this.name}" ORDER BY site ASC;`);
        return sites.map(site => Site.getSite(site.site));
    }

    async getSite(site) {
        return Site.getSite(site);
    }

    async getSiteLinks() {
        const links = await db.getAll(`SELECT peerA, peerB, type, bandwidth FROM backbone_links WHERE backbone = "${this.name}"`);
        return links.map(link => SiteLink.getSiteLink(link.peerA, link.peerB, link.type, link.bandwidth));
    }

    async getSiteLink(siteA, siteB) {
        Log("getSiteLink:", siteA, siteB);
        const link = await db.get(`SELECT peerA, peerB, type, bandwidth FROM backbone_links WHERE backbone = "${this.name}" AND peerA = (SELECT node FROM site_nodes WHERE site == "${siteA}") AND peerB = (SELECT node FROM site_nodes WHERE site == "${siteB}")`);
        Log(link);
        if (!link) {
            return null;
        }
        return SiteLink.getSiteLink(link.peerA, link.peerB, link.type, link.bandwidth);
    }

    async getHealth() {
        Log("getHealth:");
        const sites = await this.getSites();
        const healths = await Promise.all(sites.map(async site => site.getHealth()));
        Log(healths);
        const uptime = healths.length ? healths.reduce((p, v) => p + v.uptime, 0) / healths.length : 0;
        const health = healths.reduce((p, v) => p !== "bad" && (p === "good" || v.health === "bad") ? v.health : p, "good");
        Log("health:", uptime, health);
        return {
            health: health,
            uptime: Math.round(uptime)
        }
    }

}

Backbone.getBackbone = function(name) {
    return new Backbone(name);
}

Backbone.getAll = async () => {
    Log("getAll:");
    const backbones = await db.getAll(`SELECT DISTINCT backbone FROM backbone_sites;`);
    Log(backbones);
    return backbones.map(backbone => Backbone.getBackbone(backbone.backbone));
}

module.exports = Backbone;
