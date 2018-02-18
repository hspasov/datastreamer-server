const redisClient = require("redis").createClient({ detect_buffers: true, host: "redis" });
const log = require("../../modules/log");

async function createProviderSession(socketId, providerName) {
    try {
        const response = await redisClient.multi()
            .smembers(`${providerName}:clientSocketIds`)
            .sadd("providers", providerName)
            .set(`${socketId}:providerName`, providerName)
            .set(`${providerName}:socketId`, socketId)
            .set(`${providerName}:created`, new Date().getTime())
            .execAsync();
        log.info("New provider session successfully created...");
        log.verbose(`Redis response: ${response}`);
        return {
            type: "provider",
            clientSocketIds: response[0],
            socketId,
            providerName
        };
    } catch (error) {
        log.error("There was an error creating the provider session");
        throw error;
    }
}

async function findProviderSocketIdByProviderName(providerName) {
    try {
        return redisClient.getAsync(`${providerName}:socketId`);
    } catch (error) {
        log.error("In find provider socketId by provider name:");
        throw error;
    }
}

async function findProviderSocketIdByClientSocketId(clientSocketId) {
    try {
        const providerName = await redisClient.getAsync(`${clientSocketId}:providerName`);
        return findProviderSocketIdByProviderName(providerName);
    } catch (error) {
        log.error("In find provider socketId by client socketId:");
        throw error;
    }
}

async function findProviderNameBySocketId(socketId) {
    try {
        return redisClient.getAsync(`${socketId}:providerName`);
    } catch (error) {
        log.error("In find provider name by socketId:");
        throw error;
    }
}

async function findClientSessionsByProviderName(providerName) {
    try {
        return redisClient.smembersAsync(`${providerName}:clientSocketIds`);
    } catch (error) {
        log.error("In find client session by provider name:");
        throw error;
    }
}

async function findClientSessionsByProviderSocketId(socketId) {
    try {
        const providerName = await findProviderNameBySocketId(socketId);
        return findClientSessionsByProviderName(providerName);
    } catch (error) {
        log.error("In find client sessions by provider socketId");
        throw error;
    }
}

async function deleteProviderSession(socketId) {
    try {
        const providerName = await findProviderNameBySocketId(socketId);
        const response = await redisClient.multi()
            .get(`${providerName}:socketId`)
            .smembers(`${providerName}:clientSocketIds`)
            .srem("providers", providerName)
            .del(`${socketId}:providerName`)
            .del(`${providerName}:socketId`)
            .del(`${providerName}:created`)
            .execAsync();
        log.verbose(`execAsync at deleteProviderSession: ${response}`);
        return {
            socketId: response[0],
            providerName,
            clientSocketIds: response[1]
        };
    } catch (error) {
        log.error("In delete provider session:");
        throw error;
    }
}

module.exports = {
    createProviderSession,
    findProviderSocketIdByProviderName,
    findProviderSocketIdByClientSocketId,
    findProviderNameBySocketId,
    findClientSessionsByProviderSocketId,
    deleteProviderSession
};