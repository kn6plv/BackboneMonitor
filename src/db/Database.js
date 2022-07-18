
const Log = require("debug")("db");
const SQLite3 = require("sqlite3");
const SQLite = require("sqlite");
const FS = require("fs");
const Path = require("path");

const DBNAME = "state/state.db";

FS.mkdirSync(Path.dirname(DBNAME), { recursive: true });

class Database {

    async start() {
        if (this.db) {
            return;
        }
        this.db = await SQLite.open({
            filename: DBNAME,
            driver: SQLite3.cached.Database
        });
        if (Log.enabled) {
            SQLite3.verbose();
            this.db.on("trace", data => Log(data));
        }
    
        await this.db.exec("PRAGMA auto_vacuum = FULL");
        await this.db.exec("PRAGMA cache_size = 20000");
        await this.db.exec("PRAGMA synchronous = OFF");
        await this.db.exec("PRAGMA journal_mode = MEMORY");
    }

    async schema(schema) {
        for (let i = 0; i < schema.length; i++) {
            await this.db.exec(schema[i]);
        }
    }

    async query(query) {
        return await this.db.run(query);
    }

    async get(query) {
        return await this.db.get(query);
    }

    async getAll(query) {
        return await this.db.all(query);
    }

    open(config) {
        const db = this;
        let schema = config.schema;
        const init = async () => {
            if (schema) {
                await db.start();
                await db.schema(schema);
                schema = null;
            }
        }
        return {
            async query(query) {
                await init();
                return await db.query(query);
            },

            async get(query) {
                await init();
                return await db.get(query);
            },

            async getAll(query) {
                await init();
                return db.getAll(query);
            }
        };
    }
};

module.exports = new Database();
