
const Log = require("debug")("utils");
const fetch = require("node-fetch");
const AbortController = require("abort-controller").AbortController;
const Turf = require('@turf/turf');

const BANDWIDTH_GOOD = 70;
const BANDWIDTH_POOR = 50;
const UPTIME_GOOD = 95;
const UPTIME_POOR = 90;

const scoreboard = {
    marks: {},
    pending: []
};

const Utils = {

    //
    // Sleep for a number of seconds
    //
    async sleep(seconds) {
        if (seconds > 0) {
            await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        }
    },

    //
    // Fetch 'text' or 'json' data from the url, with a timeout and retry
    //
    async fetchWithTimeoutAndRetry(url, returnType, timeout, retry) {
        Log("fetchWithTimeoutAndRetry:", url);
        for (; retry >= 0; retry--) {
            const ac = new AbortController();
            const tm = setTimeout(() => ac.abort(), timeout * 1000);
            try {
                const response = await fetch(url, { signal: ac.signal });
                const val = await response[returnType]();
                clearTimeout(tm);
                return val;
            }
            catch (_) {
                clearTimeout(tm);
            }
        }
        return null;
    },

    //
    // Wait until we can set the array of marks before executing the passed function.
    //
    async mark(marks, execute) {
        if (!Array.isArray(marks)) {
            marks = [ marks ];
        }
        Log("mark:", marks);
        return new Promise(async (resolve, reject) => {
            const run = async () => {
                const r = await Utils._checkAndRun(marks, execute);
                if (!r) {
                    scoreboard.pending.push(run);
                }
                else {
                    const pending = [].concat(scoreboard.pending);
                    scoreboard.pending.length = 0;
                    for (let i = 0; i < pending.length; i++) {
                        pending[i]();
                    }
                    if ("result" in r) {
                        resolve(r.result);
                    }
                    else {
                        reject(r.error || new Error("unknown error"));
                    }
                }
            };
            run();
        });
    },

    async _checkAndRun(marks, execute) {
        // Can we run?
        for (let i = 0; i < marks.length; i++) {
            if (scoreboard.marks[marks[i]]) {
                return null;
            }
        }
        // Mark the scoreboard before we run
        for (let i = 0; i < marks.length; i++) {
            scoreboard.marks[marks[i]] = true;
        }
        try {
            return { result: await execute() };
        }
        catch (e) {
            return { error: e };
        }
        finally {
            // Unmark the scoreboard when we're done
            for (let i = 0; i < marks.length; i++) {
                delete scoreboard.marks[marks[i]];
            }
        }
    },

    canonicalHostname(hostname) {
        return !hostname ? hostname : hostname.replace(/^dtdlink\./, "")
                       .replace(/\.local\.mesh$/, "")
                       .replace(/^mid\d\./, "")
                       + ".local.mesh";
    },

    shortHostname(hostname) {
        return !hostname ? hostname : hostname.replace(/^dtdlink\./, "")
                       .replace(/\.local\.mesh$/, "")
                       .replace(/^mid\d\./, "");
    },

    getHealthStatus(bandwidth, uptime) {
        const uhealth = (uptime >= UPTIME_GOOD ? "good" : uptime >= UPTIME_POOR ? "poor" : "bad");
        const bhealth = (bandwidth >= BANDWIDTH_GOOD ? "good" : bandwidth >= BANDWIDTH_POOR ? "poor" : "bad");
        if (uhealth === "poor" || bhealth === "poor") {
            return "poor"
        }
        else if (uhealth === "bad" || bhealth === "bad") {
            return "bad"
        }
        else {
            return "good"
        }
    },

    getDistance(from, to, units) {
        const dfrom = Turf.point([ from.lon, from.lat ]);
        const dto = Turf.point([ to.lon, to.lat ]);
        return Turf.distance(dfrom, dto, { units: units || "miles" });
    }

};

module.exports = Utils;
