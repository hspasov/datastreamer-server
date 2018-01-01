const { Pool } = require("pg");

const pool = new Pool({
    user: "datastreamer",
    host: "localhost",
    database: "datastreamer",
    password: null,
    port: 5432,
});

module.exports = {
    query: (text, params) => {
        return pool.query(text, params);
    }
};