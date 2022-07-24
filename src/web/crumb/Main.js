const Log = require("debug")("crumb:main");
const Crumb = require("./Crumb");

class CrumbMain extends Crumb {

    async html() {
        return this.Template.Main({});
    }
}

module.exports = CrumbMain;
