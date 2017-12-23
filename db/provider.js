const fs = require("fs");
const path = require("path").posix;
const jwt = require("jsonwebtoken");
const db = require("./index");
const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};
const checkIfInvalidated = require("../actions/streamSession").checkIfInvalidated;

async function register(username, password, clientConnectPassword) {
    const response = await db.query("SELECT 1 FROM Providers WHERE Username = $1;", [username]);
    console.log(response.rows);
    if (response.rows.length > 0) {
        throw "username already exists";
    }
    const insertResponse = await db.query("INSERT INTO Providers (Username, Password, ClientConnectPassword, Readable, Writable) VALUES ($1, crypt($2, gen_salt('bf', 8)), crypt($3, gen_salt('bf', 8)), FALSE, FALSE) RETURNING *;", [username, password, clientConnectPassword]);
    log.info("New provider successfully created...");
    log.info(`username: ${insertResponse.rows[0].username}`);
    const certificate = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
    const token = await jwt.signAsync({
        username: insertResponse.rows[0].username
    }, certificate, {
            issuer: "datastreamer-server",
            subject: "provider",
            algorithm: "RS256",
            expiresIn: 60 * 60 // 1 hour
        });
    return {
        token,
        username: insertResponse.rows[0].username
    };
}

async function login(username, password) {
    const response = await db.query("SELECT Username FROM Providers WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]);
    console.log(response.rows);
    if (response.rows.length <= 0) {
        throw "Provider does not exist";
    }
    const certificate = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
    const token = await jwt.signAsync({
        username: response.rows[0].username
    }, certificate, {
            issuer: "datastreamer-server",
            subject: "provider",
            algorithm: "RS256",
            expiresIn: 60 * 60 // 1 hour
        });
    return {
        token,
        username: response.rows[0].username
    };
}

module.exports = {
    register,
    login
};