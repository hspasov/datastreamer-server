const log = require("../../modules/log");
const db = require("./index");
const { signProviderToken } = require("../../modules/tokenActions");
const { checkIfInvalidated } = require("../redis/streamSession");

async function register(username, password, clientConnectPassword) {
    try {
        const response = await db.query("SELECT 1 FROM Providers WHERE Username = $1;", [username]);
        if (response.rows.length > 0) {
            return { success: false };
        }
        const insertResponse = await db.query("INSERT INTO Providers (Username, Password, ClientConnectPassword, Readable, Writable) VALUES ($1, crypt($2, gen_salt('bf', 8)), crypt($3, gen_salt('bf', 8)), FALSE, FALSE) RETURNING *;", [username, password, clientConnectPassword]);
        log.info("New provider successfully created...");
        log.info(`username: ${insertResponse.rows[0].username}`);
        const token = await signProviderToken(insertResponse.rows[0].username);
        return {
            success: true,
            token,
            username: insertResponse.rows[0].username
        };
    } catch (error) {
        log.error("In register a provider:");
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await db.query("SELECT Username FROM Providers WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]);
        if (response.rows.length <= 0) {
            log.info("Unsuccessfull provider attempt to login.");
            log.verbose("Username provided:", username);
            return { success: false };
        }
        const token = await signProviderToken(response.rows[0].username);
        return {
            success: true,
            token,
            username: response.rows[0].username
        };
    } catch (error) {
        log.error("In login a provider:");
        throw error;
    }
}

module.exports = {
    register,
    login
};