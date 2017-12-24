const fs = require("fs");
const path = require("path").posix;
const jwt = require("jsonwebtoken");
const log = require("../modules/log");

const issuer = "datastreamer-server";
const algorithm = "RS256";
const providerTokenSubject = "provider";
const clientTokenSubject = "client";
const connectionTokenSubject = "clientConnection";
const expiresIn = 60 * 60; // 1 hour

async function signProviderToken(username) {
    try {
        const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
        return await jwt.signAsync({ username }, privateKey, {
            issuer,
            subject: providerTokenSubject,
            algorithm,
            expiresIn
        });
    } catch (error) {
        log.error("An error occured in an attempt to sign provider token.");
        log.error(error);
        throw error;
    }
}

async function verifyProviderToken(token) {
    try {
        const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        return await jwt.verifyAsync(token, publicKey, {
            issuer,
            subject: providerTokenSubject,
            algorithm
        });
    } catch (error) {
        log.error("In verify provider token:");
        log.error(error);
        throw error;
    }
}

async function signClientToken(username) {
    try {
        const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
        return await jwt.signAsync({ username }, privateKey, {
            issuer,
            subject: clientTokenSubject,
            algorithm,
            expiresIn
        });
    } catch (error) {
        log.error("In sign client token:");
        log.error(error);
        throw error;
    }
}

async function verifyClientToken(token) {
    try {
        const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        return await jwt.verifyAsync(token, publicKey, {
            issuer,
            subject: clientTokenSubject,
            algorithm
        });
    } catch (error) {
        log.error("In verify a client token:");
        log.error(error);
        throw error;
    }
}

async function signConnectionToken(client, provider, accessRules) {
    try {
        const privateKey = await fs.readFileAsync(path.join(__dirname, "../config/privkey.pem"));
        return await jwt.signAsync({ client, provider, accessRules }, privateKey, {
            issuer,
            subject: connectionTokenSubject,
            algorithm,
            expiresIn
        });
    } catch (error) {
        log.error("In sign connection token:");
        log.error(error);
        throw error;
    }
}

async function verifyConnectionToken(token) {
    try {
        const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        return await jwt.verifyAsync(token, publicKey, {
            issuer,
            subject: connectionTokenSubject,
            algorithm
        });
    } catch (error) {
        log.error("In verify connection token:");
        log.error(error);
        throw error;
    }
}

async function verifyToken(token) {
    try {
        const publicKey = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        return await jwt.verifyAsync(token, publicKey, { issuer, algorithm });
    } catch (error) {
        log.error("In verify token:");
        log.error(error);
        throw error;
    }
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