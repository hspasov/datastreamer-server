const { Pool } = require("pg");

const pool = new Pool({
    user: "datastreamer",
    host: "postgres",
    database: "datastreamer",
    password: "datastreamer",
    port: 5432,
});

module.exports = {
    query: (text, params) => {
        return pool.query(text, params);
    }
};