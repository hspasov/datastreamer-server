const log = require("../../modules/log");
const db = require("./index");
const { signProviderToken } = require("../../modules/tokenActions");
const { checkIfInvalidated } = require("../redis/streamSession");

async function register(username, password, clientConnectPassword) {
    try {
        const response = await db.query("SELECT create_provider($1, $2, $3);",
            [username, password, clientConnectPassword]);
        const result = response.rows[0].create_provider;
        if (!result) {
            return { success: false };
        } else {
            log.info("New provider successfully created...");
            log.info(`username: ${result.username}`);
            const token = await signProviderToken(result.username);
            return {
                success: true,
                token,
                username: result.username,
                readable: result.readable,
                writable: result.writable
            };
        }
    } catch (error) {
        log.error("In register a provider:");
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await db.query(`SELECT Username, Readable, Writable
            FROM Providers
            WHERE Username = $1 AND
            Password = crypt($2, Password);`, [username, password]);
        if (response.rows.length <= 0) {
            log.info("Unsuccessfull provider attempt to login.");
            log.verbose("Username provided:", username);
            return { success: false };
        }
        const result = response.rows[0];
        const token = await signProviderToken(result.username);
        return {
            success: true,
            token,
            username: result.username,
            readable: result.readable,
            writable: result.writable
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