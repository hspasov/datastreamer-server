const tokenActions = require("../modules/tokenActions");
const signProviderToken = tokenActions.signProviderToken;
const db = require("./index");
const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};
const checkIfInvalidated = require("../redis/streamSession").checkIfInvalidated;

async function register(username, password, clientConnectPassword) {
    const response = await db.query("SELECT 1 FROM Providers WHERE Username = $1;", [username]);
    console.log(response.rows);
    if (response.rows.length > 0) {
        throw "username already exists";
    }
    const insertResponse = await db.query("INSERT INTO Providers (Username, Password, ClientConnectPassword, Readable, Writable) VALUES ($1, crypt($2, gen_salt('bf', 8)), crypt($3, gen_salt('bf', 8)), FALSE, FALSE) RETURNING *;", [username, password, clientConnectPassword]);
    log.info("New provider successfully created...");
    log.info(`username: ${insertResponse.rows[0].username}`);
    const token = await signProviderToken(insertResponse.rows[0].username);
    return {
        token,
        username: insertResponse.rows[0].username
    };
}

async function login(username, password) {
    const response = await db.query("SELECT Username FROM Providers WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]);
    console.log(response.rows);
    if (response.rows.length <= 0) {
        throw "Provider does not exist";
    }
    const token = await signProviderToken(response.rows[0].username);
    return {
        token,
        username: response.rows[0].username
    };
}

module.exports = {
    register,
    login
};