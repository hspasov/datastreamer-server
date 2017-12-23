const tokenActions = require("../modules/tokenActions");
const signClientToken = tokenActions.signClientToken;
const verifyClientToken = tokenActions.verifyClientToken;
const signConnectionToken = tokenActions.signConnectionToken;
const db = require("./index");
const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};
const checkIfInvalidated = require("../redis/streamSession").checkIfInvalidated;

async function register(username, password) {
    const response = await db.query("SELECT 1 FROM Clients WHERE Username = $1;", [username]);
    if (response.rows.length > 0) {
        throw "username already exists";
    }
    const insertResponse = await db.query("INSERT INTO Clients (Username, Password) VALUES ($1, crypt($2, gen_salt('bf', 8))) RETURNING *;", [username, password]);
    console.log(insertResponse);
    log.info("New client successfully created...");
    log.info(`username: ${insertResponse.rows[0].username}`);
    const token = await signClientToken(insertResponse.rows[0].username);
    return {
        token,
        username: insertResponse.rows[0].username
    };
}

async function login(username, password) {
    const response = await db.query("SELECT Username FROM Clients WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]);
    console.log(response.rows);
    if (response.rows.length <= 0) {
        throw "Client does not exist";
    }
    const token = await signClientToken(response.rows[0].username);
    return {
        token,
        username: response.rows[0].username
    };
}

async function connect(token, username, password) {
    const isInvalidated = await checkIfInvalidated(token);
    if (isInvalidated) {
        throw "Authentication failed. Token has been invalidated.";
    }
    const decoded = await verifyClientToken(token);
    const providerCheck = await db.query(`SELECT Username, Readable, Writable
            FROM Providers
            WHERE Username = $1 AND
            ClientConnectPassword = crypt($2, ClientConnectPassword);`,
        [username, password]);
    console.log(providerCheck.rows);
    if (providerCheck.rows.length <= 0) {
        throw "Provider does not exist";
    }
    let accessRules;
    const readAccess = providerCheck.rows[0].readable;
    const writeAccess = providerCheck.rows[0].writable;
    if (readAccess === false && writeAccess === false) {
        accessRules = "N";
    } else if (readAccess === true && writeAccess === false) {
        accessRules = "R";
    } else if (readAccess === true && writeAccess === true) {
        accessRules = "RW";
    }
    console.log(accessRules);
    const clientAccessCheck = await db.query(`SELECT Providers.Username, ClientAccessRules.Readable, ClientAccessRules.Writable
            FROM ClientAccessRules INNER JOIN Providers
            ON ClientAccessRules.ProviderId = Providers.Id
            INNER JOIN Clients ON ClientAccessRules.ClientId = Clients.Id
            WHERE Providers.Username = $1 AND Clients.Username = $2;`,
        [username, decoded.username]);
    console.log(clientAccessCheck.rows);
    if (clientAccessCheck.rows.length > 0) {
        const readAccess = clientAccessCheck.rows[0].readable;
        const writeAccess = clientAccessCheck.rows[0].writable;
        if (readAccess === false && writeAccess === false) {
            accessRules = "N";
        } else if (readAccess === true && writeAccess === false) {
            accessRules = "R";
        } else if (readAccess === true && writeAccess === true) {
            accessRules = "RW";
        }
        console.log(accessRules);
    }
    const connectToken = await signConnectionToken(decoded.username, providerCheck.rows[0].username, accessRules);
    return {
        token: connectToken,
        username: providerCheck.rows[0].username,
        accessRules
    };
}

module.exports = {
    register,
    login,
    connect
};