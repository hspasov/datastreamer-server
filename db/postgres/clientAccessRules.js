const log = require("../../modules/log");
const db = require("./index");
const { verifyProviderToken, verifyConnectionToken } = require("../../modules/tokenActions");

async function setClientRule(providerToken, connectionToken, readable, writable) {
    try {
        try {
            await verifyProviderToken(providerToken);
        } catch (error) {
            return { success: false, reason: "providerToken" };
        }
        let decoded;
        try {
            decoded = await verifyConnectionToken(connectionToken);
        } catch (error) {
            return { success: false, reason: "connectionToken"};
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
        Writable = EXCLUDED.Writable RETURNING *;`, [decoded.provider, decoded.client, readable, writable]);
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

async function removeClientRule(token) {
    try {
        let decoded;
        try {
            decoded = await verifyConnectionToken(token);
        } catch (error) {
            return { success: false };
        }
        const response = await db.query(`DELETE FROM ClientAccessRules
    WHERE ProviderId = (SELECT Id FROM Providers WHERE Username = $1)
    AND ClientId = (SELECT Id FROM Clients WHERE Username = $2);`, [decoded.provider, decoded.client]);
        console.log(response);
        return;
    } catch (error) {
        log.error("In remove client rule:");
        throw error;
    }
}

async function setProviderDefaultRule(token, readable, writable) {
    try {
        let decoded;
        try {
            decoded = await verifyProviderToken(token);
        } catch (error) {
            return { success: false };
        }
        const response = await db.query(`UPDATE Providers
            SET Readable = $2,
            Writable = $3
            WHERE Username = $1 RETURNING *`, [decoded.username, readable, writable]);
        if (response.rows.length <= 0) {
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
    removeClientRule,
    setProviderDefaultRule
};