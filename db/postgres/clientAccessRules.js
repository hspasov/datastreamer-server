const log = require("../../modules/log");
const db = require("./index");
const { verifyProviderToken, verifyConnectionToken } = require("../../modules/tokenActions");

async function setClientRule(providerToken, connectionToken, readable, writable) {
    try {
        await verifyProviderToken(providerToken);
        const decoded = await verifyConnectionToken(connectionToken);
        const response = await db.query(`INSERT INTO ClientAccessRules (
        ProviderId, ClientId, Readable, Writable
    ) VALUES (
        (SELECT Id FROM Providers WHERE Username = $1),
        (SELECT Id FROM Clients WHERE Username = $2),
        $3, $4
    )
    ON CONFLICT (ProviderId, ClientId)
    DO UPDATE SET
    Readable = EXCLUDED.Readable,
    Writable = EXCLUDED.Writable RETURNING *;`, [decoded.provider, decoded.client, readable, writable]);
        return {
            readable: response.rows[0].readable,
            writable: response.rows[0].writable
        };
    } catch (error) {
        log.error("In set client rule:");
        log.error(error);
        throw error;
    }
}

async function removeClientRule(token) {
    try {
        const decoded = await verifyConnectionToken(token);
        const response = await db.query(`DELETE FROM ClientAccessRules
    WHERE ProviderId = (SELECT Id FROM Providers WHERE Username = $1)
    AND ClientId = (SELECT Id FROM Clients WHERE Username = $2);`, [decoded.provider, decoded.client]);
        console.log(response);
        return;
    } catch (error) {
        log.error("In remove client rule:");
        log.error(error);
        throw error;
    }
}

async function setProviderDefaultRule(token, readable, writable) {
    try {
        const decoded = await verifyProviderToken(token);
        const response = await db.query(`UPDATE Providers
    SET Readable = $2,
    Writable = $3
    WHERE Username = $1 RETURNING *`, [decoded.username, readable, writable]);
        return {
            readable: response.rows[0].readable,
            writable: response.rows[0].writable
        };
    } catch (error) {
        log.error("In set default rule for a provider:");
        log.error(error);
        throw error;
    }
}

async function getProviderDefaultRule(token) {
    try {
        const decoded = await verifyProviderToken(token);
        const response = await db.query(`SELECT Readable, Writable
        FROM Providers
        WHERE Username = $1`, [decoded.username]);
        return {
            readable: response.rows[0].readable,
            writable: response.rows[0].writable
        };
    } catch (error) {
        log.error("In get default rule for a provider:");
        log.error(error);
        throw error;
    }
}

module.exports = {
    setClientRule,
    removeClientRule,
    setProviderDefaultRule,
    getProviderDefaultRule
};