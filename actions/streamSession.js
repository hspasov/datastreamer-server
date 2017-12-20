const fs = require("fs");
const path = require("path").posix;
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

async function createNewStreamSession(socketId, token) {
    try {
        log.verbose(`Request for new stream session. Checking validity of token "${token}"`);
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            throw "Authentication failed. Token has been invalidated.";
        }
        const certificate = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        const decoded = await jwt.verifyAsync(token, certificate, {
            issuer: "datastreamer-server",
            algorithm: ["RS256"]
        });
        let sessionInfo;
        switch (decoded.sub) {
            case "provider":
                sessionInfo = await createNewProviderSession(socketId, decoded.username);
                break;
            case "clientConnection":
                sessionInfo = await createNewClientSession(socketId, decoded.provider);
                break;
            default:
                throw `Error: Invalid argument "subject": must be "provider" or "clientConnection", but was ${decoded.sub}.`;
        }
        return sessionInfo;
    } catch (error) {
        log.error("While creating stream session:");
        log.error(error.name);
        log.error(error.message);
        throw error;
    }
}

async function deleteStreamSession(socketId) {
    try {
        const clientSession = await findClientSession(socketId);
        if (!clientSession) {
            const providerName = await findProviderNameBySocketId(socketId);
            if (!providerName) {
                throw "On deleting stream session: Not found in database!";
            } else {
                const providerSession = await deleteProviderSession(socketId);
                return {
                    type: "provider",
                    socketId: providerSession.socketId,
                    providerName: providerSession.providerName,
                    clientSocketIds: providerSession.clientSocketIds
                };
            }
        } else {
            const clientSession = await deleteClientSession(socketId);
            return {
                type: "client",
                socketId: clientSession.socketId,
                providerName: clientSession.providerName
            };
        }
    } catch (error) {
        // todo: error
        throw error;
    }
}

async function invalidateToken(token) {
    try {
        if (!token) throw false;
        log.verbose(`Invalidising token ${token}`);
        const certificate = await fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem"));
        const decoded = await jwt.verifyAsync(token, certificate, {
            issuer: "datastreamer-server",
            algorithm: ["RS256"]
        });
        const redisTime = await redisClient.timeAsync();
        const time = new Date();
        time.setSeconds(redisTime[0] - 60 * 60);
        const response = await redisClient.multi()
            .zremrangebyscore("invalidatedTokens", 0, time.getSeconds())
            .zadd("invalidatedTokens", redisTime[0], token)
            .execAsync();
        log.verbose(response);
        return true;
    } catch (error) {
        log.error("While invalidating token:");
        throw error;
    }
}

async function checkIfInvalidated(token) {
    try {
        const redisTime = await redisClient.timeAsync();
        const time = new Date();
        time.setSeconds(redisTime[0] - 60 * 60);
        const response = await redisClient.multi()
            .zrank("invalidatedTokens", token)
            .zremrangebyscore("invalidatedTokens", 0, time.getSeconds())
            .execAsync();
        log.verbose(`Redis check for invalidated token. Response: ${response}`);
        return response[0] !== null;
    } catch (error) {
        // todo: error
        throw error;
    }
}

module.exports = {
    createNewStreamSession,
    deleteStreamSession,
    invalidateToken,
    checkIfInvalidated
};