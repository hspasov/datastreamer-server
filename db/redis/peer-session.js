const log = require("../../modules/log");
const redisClient = require("redis").createClient({ detect_buffers: true });
const { verifyToken } = require("../../modules/token-actions");
const {
    createProviderSession,
    deleteProviderSession,
    findProviderNameBySocketId
} = require("./provider-session");
const {
    createClientSession,
    findClientSession,
    deleteClientSession
} = require("./client-session");

async function createPeerSession(socketId, token) {
    try {
        log.verbose(`Request for new stream session. Checking validity of token "${token}"`);
        const isInvalidated = await checkIfInvalidated(token);
        if (isInvalidated) {
            return null;
        }
        const decoded = await verifyToken(token);
        if (!decoded) {
            return null;
        }
        let sessionInfo;
        switch (decoded.sub) {
            case "provider":
                sessionInfo = await createProviderSession(socketId, decoded.username);
                return sessionInfo;
            case "clientConnection":
                sessionInfo = await createClientSession(socketId, decoded.provider);
                return {
                    ...sessionInfo,
                    client: { username: decoded.client },
                    readable: decoded.readable,
                    writable: decoded.writable
                };
            default:
                return null;
        }
    } catch (error) {
        log.error("While creating peer session:");
        throw error;
    }
}

async function deletePeerSession(socketId) {
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
        if (!token) return false;
        log.verbose("Invalidating token");
        const decoded = await verifyToken(token);
        if (!decoded) return false;
        const redisTime = await redisClient.timeAsync();
        const time = new Date();
        time.setSeconds(redisTime[0] - 60 * 60);
        const response = await redisClient.multi()
            .zremrangebyscore("invalidatedTokens", 0, time.getSeconds())
            .zadd("invalidatedTokens", redisTime[0], token)
            .execAsync();
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
        return response[0] !== null;
    } catch (error) {
        log.error("Check if token invalidated failed:");
        throw error;
    }
}

module.exports = {
    createPeerSession,
    deletePeerSession,
    invalidateToken,
    checkIfInvalidated
};