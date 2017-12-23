const tokenActions = require("../modules/tokenActions");
const verifyProviderToken = tokenActions.verifyProviderToken;
const verifyConnectionToken = tokenActions.verifyConnectionToken;
const db = require("./index");

async function setClientRule(providerToken, connectionToken, readable, writable) {
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
}

async function removeClientRule(token) {
    const decoded = await verifyConnectionToken(token);
    const response = await db.query(`DELETE FROM ClientAccessRules
    WHERE ProviderId = (SELECT Id FROM Providers WHERE Username = $1)
    AND ClientId = (SELECT Id FROM Clients WHERE Username = $2);`, [decoded.provider, decoded.client]);
    console.log(response);
    return;
}

async function setProviderDefaultRule(token, readable, writable) {
    const decoded = await verifyProviderToken(token);
    const response = await db.query(`UPDATE Providers
    SET Readable = $2,
    Writable = $3
    WHERE Username = $1 RETURNING *`, [decoded.username, readable, writable]);
    return {
        readable: response.rows[0].readable,
        writable: response.rows[0].writable
    };
}

async function getProviderDefaultRule(token) {
    const decoded = await verifyProviderToken(token);
    const response = await db.query(`SELECT Readable, Writable
        FROM Providers
        WHERE Username = $1`, [decoded.username]);
    return {
        readable: response.rows[0].readable,
        writable: response.rows[0].writable
    };
}

module.exports = {
    setClientRule,
    removeClientRule,
    setProviderDefaultRule,
    getProviderDefaultRule
};