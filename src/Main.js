#! /usr/bin/env nodejs

process.on("uncaughtException", e => {
    console.error("uncaughtException:");
    console.error(e)
});
process.on("unhandledRejection", e => {
    console.error("unhandledRejection:");
    console.error(e)
});

process.on("SIGTERM", async () => {
    process.exit();
});

require("./monitor/Monitor").run();
require("./web/Web").run();
