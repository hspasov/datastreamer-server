const log = require("../../modules/log");
const db = require("./index");
const { verifyProviderToken } = require("../../modules/token-actions");

async function setClientRule(providerToken, clientUsername, readable, writable) {
    try {
        let decoded;
        const result = await verifyProviderToken(providerToken);
        if (result.error) {
            return { success: false, reason: "providerToken" };
        } else {
            decoded = result.decoded;
        }
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
        Writable = EXCLUDED.Writable RETURNING *;`, [decoded.username, clientUsername, readable, writable]);
        return {
            success: true,
            readable: response.rows[0].readable,
            writable: response.rows[0].writable
        };
    } catch (error) {
        log.error("In set client rule:");
        throw error;
    }
}

async function deleteClientRule(providerToken, clientUsername) {
    try {
        let decoded;
        const result = await verifyProviderToken(providerToken);
        if (result.error) {
            return { success: false };
        } else {
            decoded = result.decoded;
        }
        const response = await db.query(`DELETE FROM ClientAccessRules
    WHERE ProviderId = (SELECT Id FROM Providers WHERE Username = $1)
    AND ClientId = (SELECT Id FROM Clients WHERE Username = $2);`, [decoded.username, clientUsername]);
        return { success: true };
    } catch (error) {
        log.error("In remove client rule:");
        throw error;
    }
}

async function setProviderDefaultRule(token, readable, writable) {
    try {
        let decoded;
        const result = await verifyProviderToken(token);
        if (result.error) {
            return { success: false };
        } else {
            decoded = result.decoded;
        }
        const response = await db.query(`UPDATE Providers
            SET Readable = $2,
            Writable = $3
            WHERE Username = $1 RETURNING *`, [decoded.username, readable, writable]);
        if (response.rows.length <= 0) {
            console.log(decoded);
            return { success: false };
        }
        return {
            success: true,
            readable: response.rows[0].readable,
            writable: response.rows[0].writable
        };
    } catch (error) {
        log.error("In set default rule for a provider:");
        throw error;
    }
}

module.exports = {
    setClientRule,
    deleteClientRule,
    setProviderDefaultRule
};