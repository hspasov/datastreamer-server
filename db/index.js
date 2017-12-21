const { Pool } = require("pg");

const pool = new Pool({
    user: "datastreamer",
    host: "datastreamer.local",
    database: "datastreamer",
    password: null,
    port: 5432,
});

module.exports = {
    query: async (text, params) => {
        return await pool.query(text, params);
    }
};