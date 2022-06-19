
const Log = require("debug")("utils");
const fetch = require("node-fetch");
const AbortController = require("abort-controller").AbortController;

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
    // Fetch 'text' or 'json' data from the url, with a timeout.
    //
    async fetchWithTimeout(url, returnType, timeout) {
        Log("fetchWithTimeout:", url);
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
            return null;
        }
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
    }

};

module.exports = Utils;
