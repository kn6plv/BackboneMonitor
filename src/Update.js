#! /usr/bin/env nodejs

const Backbone = require("./db/Backbone");
const Site = require("./db/Site");
const Node = require("./db/Node");


(async function() {

    const b = Backbone.getBackbone("Bay Area Backbone");

    async function addSite(name, root, nodes) {
        const site = Site.getSite(name);
        const sroot = Node.getNode(root + ".local.mesh");
        await site.addRootNode(sroot);
        await site.addNode(sroot);
        if (nodes) {
            for (let i = 0; i < nodes.length; i++) {
                await site.addNode(Node.getNode(nodes[i] + ".local.mesh"));
            }
        }
        await b.addSite(site);
        return sroot;
    }

    async function AddSiteNodes(name, nodes) {
        const site = Site.getSite(name);
        if (nodes) {
            for (let i = 0; i < nodes.length; i++) {
                await site.addNode(Node.getNode(nodes[i] + ".local.mesh"));
            }
        }
    }

    await addSite("San Bruno Mtn", "W2GMD-SANBRUNO-RM5", [ "W2GMD-SANBRUNO-HAP", "W2GMD-SANBRUNO-NSM5" ]);


})();
