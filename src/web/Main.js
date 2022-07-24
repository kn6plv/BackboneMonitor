
const Log = require("debug")("web:main");
const CrumbMain = require("./crumb/Main");
const CrumbBackbone = require("./crumb/Backbone");

async function HTML(ctx) {
    Log("loading:");
    ctx.body = await new CrumbMain().html();
    ctx.type = "text/html";
}

async function WS(ctx) {

    const State = {
        breadcrumbs: [],
        change: "none",

        send: function(cmd, value) {
            try {
                ctx.websocket.send(JSON.stringify({
                    cmd: cmd,
                    value: value
                }));
            }
            catch (e) {
                Log(e);
            }
        },

        update: async function() {
            const last = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.send("html.update", {
                id: "info",
                html: await last.html()
            });
            this.send("html.update", {
                id: "header",
                html: State.breadcrumbs[0].breadcrumbs()
            });
        }
    };

    const root = new CrumbBackbone();
    root.state = State;
    State.breadcrumbs.push(root);

    ctx.websocket.on('error', () => {
         ctx.websocket.close();
    });

    const q = [];
    ctx.websocket.on('message', async data => {
        try {
            const msg = JSON.parse(data);
            Log("msg", msg);
            const cmd = `cmd_${msg.cmd || "missing"}`;
            State.change = "none";
            const dispatch = async () => {
                let fn = null;
                let ctx = State.breadcrumbs[State.breadcrumbs.length - 1];
                if (ctx) {
                    fn = ctx[cmd];
                }
                if (!fn) {
                    ctx = null;
                    fn = State[cmd];
                }
                if (fn) {
                    q.push(async () => {
                        try {
                            if (!root.backbone) {
                                await root.init();
                            }
                            Log("exec", msg);
                            await fn.call(ctx, msg);
                            Log(State);
                            switch (State.change) {
                                case "push":
                                case "update":
                                    await State.update();
                                    break;
                                case "pop":
                                    State.change = "update";
                                    dispatch();
                                    break;
                                default:
                                    break;
                            }
                        }
                        catch (e) {
                            Log(e);
                        }
                    });
                    if (q.length === 1) {
                        while (q.length) {
                            await q[0]();
                            q.shift();
                        }
                    }
                }
            }
            await dispatch();
        }
        catch (e) {
            Log(e);
        }
    });
}

module.exports = {
    HTML: HTML,
    WS: WS
};
