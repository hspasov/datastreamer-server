const log = require("../../modules/log");
const redisClient = require("redis").createClient({ detect_buffers: true });
const { verifyToken } = require("../../modules/tokenActions");
const {
    createNewProviderSession,
    deleteProviderSession,
    findProviderNameBySocketId
} = require("./providerSession");
const {
    createNewClientSession,
    findClientSession,
    deleteClientSession
} = require("./clientSession");

async function createNewStreamSession(socketId, token) {
    try {
        log.verbose(`Request for new stream session. Checking validity of token "${token}"`);
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            throw "Authentication failed. Token has been invalidated.";
        }
        const decoded = await verifyToken(token);
        let sessionInfo;
        switch (decoded.sub) {
            case "provider":
                sessionInfo = await createNewProviderSession(socketId, decoded.username);
                return sessionInfo;
            case "clientConnection":
                sessionInfo = await createNewClientSession(socketId, decoded.provider);
                return {
                    ...sessionInfo,
                    client: { username: decoded.client },
                    accessRules: decoded.accessRules
                };
            default:
                throw `Error: Invalid argument "subject": must be "provider" or "clientConnection", but was ${decoded.sub}.`;
        }
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
        log.verbose(`Invalidating token ${token}`);
        const decoded = await verifyToken(token);
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