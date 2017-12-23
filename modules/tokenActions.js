const fs = require("fs");
const path = require("path").posix;
const jwt = require("jwt");

const issuer = "datastreamer-server";
const algorithm = "RS256";
const providerTokenSubject = "provider";
const clientTokenSubject = "client";
const connectionTokenSubject = "clientConnection";
const expiresIn = 60 * 60; // 1 hour

async function signProviderToken(username) {
    const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
    return await jwt.signAsync({ username }, privateKey, {
        issuer,
        providerTokenSubject,
        algorithm,
        expiresIn
    });
}

async function verifyProviderToken(token) {
    const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
    return await jwt.verifyAsync(token, publicKey, {
        issuer,
        providerTokenSubject,
        algorithm
    });
}

async function signClientToken(username) {
    const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
    return await jwt.signAsync({ username }, privateKey, {
        issuer,
        clientTokenSubject,
        algorithm,
        expiresIn
    });
}

async function verifyClientToken(token) {
    const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
    return await jwt.verifyAsync(token, publicKey, {
        issuer,
        clientTokenSubject,
        algorithm
    });
}

async function signConnectionToken(client, provider, accessRules) {
    const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
    return await jwt.signAsync({ client, provider, accessRules}, privateKey, {
        issuer,
        connectionTokenSubject,
        algorithm,
        expiresIn
    });
}

async function verifyConnectionToken(token) {
    const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
    return await jwt.verifyAsync(token, publicKey, {
        issuer,
        connectionTokenSubject,
        algorithm
    });
}

async function verifyToken(token) {
    const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
    return await jwt.verifyAsync(token, publicKey, { issuer, algorithm });
}

module.exports = {
    signProviderToken,
    verifyProviderToken,
    signClientToken,
    verifyClientToken,
    signConnectionToken,
    verifyConnectionToken,
    verifyToken
};