
const Template = require("./Template");

Template.load();

class Crumb {

    Template = Template

    constructor() {
    }

    get name() {
        throw new Error("no name");
    }

    async init() {
    }

    get path() {
        const b = this.state.breadcrumbs;
        let path = "";
        for (let i = 0; i < b.length; i++) {
            path = `${path}@${b[i].name}`;
            if (b[i] === this) {
                break;
            }
        }
        return `#${path.substring(1)}`;
    }

    stripPath(path) {
        const idx = path.indexOf(this.name);
        if (idx === -1) {
            return null;
        }
        else {
            return path.slice(idx + 1);
        }
    }

    send() {
        this.state.send();
    }

    async pushCrumb(name, config) {
        const Ncrumb = require(`./${name}`);
        const crumb = new Ncrumb(config);
        crumb.state = this.state;
        await crumb.init();
        this.state.breadcrumbs.push(crumb);
        this.state.change = "push";
    }

    popCrumb() {
        this.state.breadcrumbs.pop();
        this.state.change = "pop";
    }

    updateCrumb() {
        this.state.change = "update";
    }

    getBackbone() {
        return this.state.breadcrumbs[0].backbone;
    }

}

module.exports = Crumb;
