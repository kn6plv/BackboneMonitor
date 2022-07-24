
const Log = require("debug")("crumb:site");
const Crumb = require("./Crumb");
const Utils = require("../../Utils");

class Site extends Crumb {

    constructor(config) {
        super(config);
        this.site = config.site;
    }

    get name() {
        return this.site.name;
    }

    async html() {

        const location = await this.site.getLocation();
        const nodes = await this.site.getNodes();
        const root = await this.site.getRootNode();
        const dots = [];

        const nr = nodes.length;
        if (nr === 1) {
            const name = Utils.shortHostname(root.name);
            dots.push({
                l: location,
                h: await root.getHealth(),
                t: name,
                r: `${this.path}@${name}`,
            });
        }
        else {
            const angle = 360 / nr;
            for (let i = 0; i < nr; i++) {
                const nlocation = this.latLonBearingDistance(location.lat, location.lon, angle * i, 10);
                const name = Utils.shortHostname(nodes[i].name);
                dots.push({
                    l: nlocation,
                    h: await nodes[i].getHealth(),
                    t: name,
                    r: `${this.path}@${name}`,
                });
            }
        }
        
        return this.Template.SiteDisplay({
            path: this.path,
            map: {
                dots: dots,
                lines: [],
                center: location
            },
            info: {
                site: this.site.name,
                health: await this.site.getHealth(),
                nodes: await Promise.all(nodes.map(async node => {
                    return {
                        name: Utils.shortHostname(node.name),
                        health: await node.getHealth()
                    }
                }))
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
            this.updateCrumb();
        }
        else {
            await this.pushCrumb("Node", { node: await this.site.getNode(selection[0]) });
        }
    }

    latLonBearingDistance(lat, lon, bearing, distance) {
        const brng = bearing / 180 * Math.PI;
        const dR = distance / 6378100 // Radius of the Earth (m)

        const lat1 = lat / 180 * Math.PI;
        const lon1 = lon / 180 * Math.PI;

        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(brng));
        const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));

        return {
            lat: lat2 / Math.PI * 180,
            lon: lon2 / Math.PI * 180
        };
    }

}

module.exports = Site;
