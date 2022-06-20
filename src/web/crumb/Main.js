const Log = require("debug")("crumb:main");
const Crumb = require("./Crumb");

class CrumbMain extends Crumb {

    constructor(root) {
        super("");
        this.root = root;
    }

    async html() {
        return this.Template.Main({
            content: await this.root.html(),
            title: this.root.breadcrumbs()
        });
    }
}

module.exports = CrumbMain;
