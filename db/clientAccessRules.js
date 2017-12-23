const db = require("./index");

async function setRule(providerName, clientName, readable, writable) {
    await db.query(`INSERT INTO ClientAccessRules (
        ProviderId, ClientId, Readable, Writable
    ) VALUES (
        SELECT Id FROM Providers WHERE Username = $1,
        SELECT Id FROM Clients WHERE Username = $2,
        $3, $4
    )
    ON CONFLICT (ProviderId, ClientId)
    DO UPDATE SET
    Readable = EXCLUDED.Readable,
    Writable = EXCLUDED.Writable`, [providerName, clientName, readable, writable]);
}

async function getClientAccessRules() {

}