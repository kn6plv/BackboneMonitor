
const Log = require("debug")("test:iperf3");
const Utils = require("../Utils");

class IPerf3 {

    constructor(config) {
        this.client = config.client;
        this.server = config.server;
        this.protocol = config.protocol || "tcp";
        this.timeout = config.timeout || 20;
        this.retries = config.retries || 2;
    }

    async run() {
        Log(`run: client ${this.client} <- server ${this.server} (${this.protocol})`);
        for (let i = 0; i < this.retries; i++) {
            const results = await this.runTest();
            if (results) {
                return results;
            }
        }
        return null;
    }

    async runTest() {
        return await Utils.mark([ this.client, this.server ], async () => {
            Log("running:");
            let iperf = null;
            const text = await Utils.fetchWithTimeout(`http://${this.client}:8080/cgi-bin/iperf?server=${this.server}&protocol=${this.protocol}`, "text", this.timeout);
            if (text) {
                const patt = [
                    { p: /([\d\.]+)\sMbits\/sec.+\(([\d\.]+)%.*receiver/g,  e: m => { return { bandwidth: parseFloat(m[1]) } } },
                    { p: /([\d\.]+)\sKbits\/sec.+\(([\d\.]+)%.*receiver/g,  e: m => { return { bandwidth: parseFloat(m[1]) / 1000 } } },
                    { p: /([\d\.]+)\sMbits\/sec.*receiver/g,                e: m => { return { bandwidth: parseFloat(m[1]) } } },
                    { p: /([\d\.]+)\sKbits\/sec.*receiver/g,                e: m => { return { bandwidth: parseFloat(m[1]) / 1000 } } }
                ];
                const lines = text.split("\n");
                for (let l = 0; l < lines.length && !iperf; l++) {
                    const line = lines[l];
                    for (let i = 0; i < patt.length && !iperf; i++) {
                        const m = patt[i].p.exec(line);
                        if (m) {
                            iperf = patt[i].e(m);
                        }
                    }
                }   
            }
            return iperf;
        });
    }

}

module.exports = IPerf3;
