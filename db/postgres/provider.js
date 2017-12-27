const log = require("../../modules/log");
const db = require("./index");
const { signProviderToken, verifyProviderToken } = require("../../modules/token-actions");
const { checkIfInvalidated, invalidateToken } = require("../redis/peer-session");

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
        const response = await db.query(`SELECT * FROM Providers
            WHERE Username = $1
            AND Password = crypt($2, Password);`, [username, password]);
        if (response.rows.length <= 0) {
            log.info("Unsuccessfull provider attempt to login.");
            log.verbose("Username provided:", username);
            return { success: false };
        }
        const result = response.rows[0];
        const banned = await db.query(`SELECT
                Clients.Username AS Username,
                ClientAccessRules.Readable AS Readable,
                ClientAccessRules.Writable AS Writable
                FROM ClientAccessRules INNER JOIN Clients
                ON ClientAccessRules.ClientId = Clients.Id
                WHERE ClientAccessRules.ProviderId = $1 AND
                ClientAccessRules.Readable = FALSE;`, [result.id]);
        console.log(banned.rows);
        const token = await signProviderToken(result.username);
        return {
            success: true,
            token,
            username: result.username,
            readable: result.readable,
            writable: result.writable,
            banned: banned.rows
        };
    } catch (error) {
        log.error("In login a provider:");
        throw error;
    }
}

async function changePassword(token, oldPassword, newPassword) {
    try {
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            return { success: false, reason: "token" };
        }
        let decoded;
        try {
            decoded = await verifyProviderToken(token);
        } catch (error) {
            log.info("In change password request could not verify provider token.");
            log.verbose(error);
            return { success: false, reason: "token" };
        }
        const response = await db.query(`SELECT change_provider_password($1, $2, $3);`,
            [decoded.username, oldPassword, newPassword]);
        if (!response.rows[0].change_provider_password) {
            return { success: false, reason: "credentials" };
        }
        await invalidateToken(token);
        const newToken = await signProviderToken(decoded.username);
        return { success: true, token: newToken };
    } catch (error) {
        log.error("In change provider password:");
        throw error;
    }
}

async function deleteAccount(token, password) {
    try {
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            return { success: false, reason: "token" };
        }
        let decoded;
        try {
            decoded = await verifyProviderToken(token);
        } catch (error) {
            log.info("In delete request could not verify provider token.");
            log.verbose(error);
            return { success: false, reason: "token" };
        }
        const response = await db.query(`SELECT delete_provider($1, $2);`, [decoded.username, password]);
        if (!response.rows[0].delete_provider) {
            return { success: false, reason: "credentials" };
        }
        await invalidateToken(token);
        return { success: true };
    } catch (error) {
        log.error("In delete provider:");
        throw error;
    }
}

module.exports = {
    register,
    login,
    changePassword,
    deleteAccount
};