const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const redisClient = require("redis").createClient({ detect_buffers: true });

const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const providerSessionActions = require("./providerSession");
const clientSessionActions = require("./clientSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

const createNewProviderSession = providerSessionActions.createNewProviderSession;
const deleteProviderSession = providerSessionActions.deleteProviderSession;
const findProviderNameBySocketId = providerSessionActions.findProviderNameBySocketId;

const createNewClientSession = clientSessionActions.createNewClientSession;
const findClientSession = clientSessionActions.findClientSession;
const deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(socketId, token) {
    return new Promise((resolve, reject) => {
        log.verbose(`Request for new stream session. Checking validity of token "${token}"`);
        isInvalidated(token).then(isInvalidated => {
            if (isInvalidated) {
                reject("Authentication failed. Token has been invalidated.");
            } else {
                return fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
            }
        }).then(certificate => {
            return jwt.verifyAsync(token, certificate, {
                issuer: "datastreamer-server",
                algorithm: ["RS256"]
            });
        }).then(decoded => {
            if (decoded.sub === "provider") {
                return createNewProviderSession(socketId, decoded.username);
            } else if (decoded.sub == "clientConnection") {
                return createNewClientSession(socketId, decoded.provider);
            } else {
                reject(`Error: Invalid argument "subject": must be "provider" or "clientConnection", but was ${decoded.subject}.`);
            }
        }).then(sessionInfo => {
            resolve(sessionInfo);
        }).catch(error => {
            log.error("While creating stream session:");
            log.error(error.name);
            log.error(error.message);
            reject(error);
        });
    });
}

function deleteStreamSession(socketId) {
    return new Promise((resolve, reject) => {
        findClientSession(socketId).then(clientSession => {
            if (!clientSession) {
                findProviderNameBySocketId(socketId).then(providerName => {
                    if (!providerName) {
                        reject("On deleting stream session: Not found in database!");
                    } else {
                        deleteProviderSession(socketId).then(providerSession => {
                            resolve({
                                type: "provider",
                                socketId: providerSession.socketId,
                                providerName: providerSession.providerName,
                                clientSocketIds: providerSession.clientSocketIds
                            });
                        });
                    }
                });
            } else {
                deleteClientSession(socketId).then(clientSession => {
                    resolve({
                        type: "client",
                        socketId: clientSession.socketId,
                        providerName: clientSession.providerName
                    });
                });
            }
        }).catch(error => {
            reject(error);
        });
    });
}

function invalidateToken(token) {
    return new Promise((resolve, reject) => {
        log.verbose(`Invalidising token ${token}`);
        fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem")).then(certificate => {
            return jwt.verifyAsync(token, certificate, {
                issuer: "datastreamer-server",
                algorithm: ["RS256"]
            });
        }).then(decoded => {
            return redisClient.timeAsync().then(response => {
                const time = new Date();
                time.setSeconds(response[0] - 60 * 60);
                return redisClient.multi()
                    .zremrangebyscore("invalidatedTokens", 0, time.getSeconds())
                    .zadd("invalidatedTokens", response[0], token)
                    .execAsync();
            });
        }).then(redisResponse => {
            log.verbose(redisResponse);
            resolve();
        }).catch(error => {
            log.error("While invalidating token:");
            log.error(error.name);
            log.error(error.message);
            reject(error);
        })
    });
}

function isInvalidated(token) {
    return new Promise((resolve, reject) => {
        redisClient.timeAsync().then(response => {
            const time = new Date();
            time.setSeconds(response[0] - 60 * 60);
            return redisClient.multi()
                .zrank("invalidatedTokens", token)
                .zremrangebyscore("invalidatedTokens", 0, time.getSeconds())
                .execAsync();
        }).then(response => {
            log.verbose(`Redis check for invalidated token. Response: ${response}`);
            resolve(response[0] !== null);
        }).catch(error => {
            reject(error);
        })
    });
}

module.exports = {
    createNewStreamSession,
    deleteStreamSession,
    invalidateToken,
    isInvalidated
};