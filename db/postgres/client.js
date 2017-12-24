const log = require("../../modules/log");
const db = require("./index");
const { signClientToken, verifyClientToken, signConnectionToken } = require("../../modules/tokenActions");
const { checkIfInvalidated } = require("../redis/streamSession");

async function register(username, password) {
    try {
        const response = await db.query("SELECT 1 FROM Clients WHERE Username = $1;", [username]);
        if (response.rows.length > 0) {
            throw "username already exists";
        }
        const insertResponse = await db.query(`INSERT INTO Clients (Username, Password)
            VALUES ($1, crypt($2, gen_salt('bf', 8)))
             RETURNING *;`, [username, password]);
        log.info("New client successfully created...");
        log.info(`username: ${insertResponse.rows[0].username}`);
        const token = await signClientToken(insertResponse.rows[0].username);
        return {
            token,
            username: insertResponse.rows[0].username
        };
    } catch (error) {
        log.error("In register client:");
        log.error(error);
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await db.query("SELECT Username FROM Clients WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]);
        if (response.rows.length <= 0) {
            throw "Client does not exist";
        }
        const token = await signClientToken(response.rows[0].username);
        return {
            token,
            username: response.rows[0].username
        };
    } catch (error) {
        log.error("In login client:");
        log.error(error);
        throw error;
    }
}

async function connect(token, username, password) {
    try {
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
        const clientAccessCheck = await db.query(`SELECT Providers.Username, ClientAccessRules.Readable, ClientAccessRules.Writable
            FROM ClientAccessRules INNER JOIN Providers
            ON ClientAccessRules.ProviderId = Providers.Id
            INNER JOIN Clients ON ClientAccessRules.ClientId = Clients.Id
            WHERE Providers.Username = $1 AND Clients.Username = $2;`,
            [username, decoded.username]);
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
        }
        const connectToken = await signConnectionToken(decoded.username, providerCheck.rows[0].username, accessRules);
        return {
            token: connectToken,
            username: providerCheck.rows[0].username,
            accessRules
        };
    } catch (error) {
        log.error("In client connect to provider:");
        log.error(error);
        throw error;
    }
}

module.exports = {
    register,
    login,
    connect
};