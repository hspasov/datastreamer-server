const log = require("../../modules/log");
const db = require("./index");
const { signClientToken, verifyClientToken, signConnectionToken } = require("../../modules/token-actions");
const { checkIfInvalidated, invalidateToken } = require("../redis/peer-session");

async function register(username, password) {
    try {
        const response = await db.query(`SELECT Username
            FROM create_client($1, $2)
            AS (Username VARCHAR);`, [username, password]);
        if (response.rows.length <= 0 || response.rows.length > 1) {
            throw `Invalid response from create_client: response.rows.length: ${response.rows.length}`;
        }
        if (!response.rows[0].username) {
            return { success: false };
        } else {
            log.info("New client successfully created...");
            log.verbose(`Username: ${response.rows[0].username}`);
            const token = await signClientToken(response.rows[0].username);
            return {
                success: true,
                token,
                username: response.rows[0].username
            };
        }
    } catch (error) {
        log.error("In register client:");
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await db.query(`SELECT Username FROM Clients
            WHERE Username = $1 AND
            Password = crypt($2, Password);`, [username, password]);
        if (response.rows.length <= 0) {
            log.info("Unsuccessfull client attempt to login.");
            log.verbose("Username provided:", username);
            return { success: false };
        }
        const token = await signClientToken(response.rows[0].username);
        return {
            success: true,
            token,
            username: response.rows[0].username
        };
    } catch (error) {
        log.error("In login client:");
        throw error;
    }
}

async function connect(token, username, password) {
    try {
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            return { success: false, reason: "token" };
        }
        let decoded;
        try {
            decoded = await verifyClientToken(token);
        } catch (error) {
            log.info("In connect request could not verify client token.");
            log.verbose(error);
            return { success: false, reason: "token" };
        }
        const response = await db.query(`SELECT Username, Readable, Writable
            FROM get_access_rules($1, $2, $3)
            AS (Username VARCHAR, Readable BOOLEAN, Writable BOOLEAN);`,
            [username, decoded.username, password]);
        if (response.rows.length <= 0 || response.rows.length > 1) {
            throw `Invalid response from get_access_rules: response.rows.length: ${response.rows.length}`;
        }
        if (!response.rows[0].username) {
            return { success: false, reason: "credentials" };
        } else if (!response.rows[0].readable) {
            return { success: false, reason: "credentials" };
        }
        const provider = response.rows[0].username;
        const readable = response.rows[0].readable;
        const writable = response.rows[0].writable
        const connectToken = await signConnectionToken(decoded.username, provider, readable, writable);
        return {
            success: true,
            token: connectToken,
            username: provider,
            readable,
            writable
        };
    } catch (error) {
        log.error("In client connect to provider:");
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
            decoded = await verifyClientToken(token);
        } catch (error) {
            log.info("In change password request could not verify client token.");
            log.verbose(error);
            return { success: false, reason: "token" };
        }
        const response = await db.query(`SELECT change_client_password($1, $2, $3);`,
            [decoded.username, oldPassword, newPassword]);
        if (!response.rows[0].change_client_password) {
            return { success: false, reason: "credentials" };
        }
        await invalidateToken(token);
        const newToken = await signClientToken(decoded.username);
        return { success: true, token: newToken };
    } catch (error) {
        log.error("In change client password:");
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
            decoded = await verifyClientToken(token);
        } catch (error) {
            log.info("In delete request could not verify client token.");
            log.verbose(error);
            return { success: false, reason: "token" };
        }
        const response = await db.query(`SELECT delete_client($1, $2);`, [decoded.username, password]);
        if (!response.rows[0].delete_client) {
            return { success: false, reason: "credentials" };
        }
        await invalidateToken(token);
        return { success: true };
    } catch (error) {
        log.error("In delete client:");
        throw error;
    }
}

module.exports = {
    register,
    login,
    connect,
    changePassword,
    deleteAccount
};