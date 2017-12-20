const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const redisClient = require("redis").createClient({ detect_buffers: true });

const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

async function createNewProviderSession(socketId, providerName) {
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
        return await redisClient.getAsync(`${providerName}:socketId`);
    } catch (error) {
        // todo: error
        throw error;
    }
}

async function findProviderSocketIdByClientSocketId(clientSocketId) {
    try {
        const providerName = await redisClient.getAsync(`${clientSocketId}:providerName`);
        return await findProviderSocketIdByProviderName(providerName);
    } catch (error) {
        // todo: error
        throw error;
    }
}

async function findProviderNameBySocketId(socketId) {
    try {
        return await redisClient.getAsync(`${socketId}:providerName`);
    } catch (error) {
        // todo: error
        throw error;
    }
}

async function findClientSessionsByProviderName(providerName) {
    try {
        return await redisClient.smembersAsync(`${providerName}:clientSocketIds`);
    } catch (error) {
        // todo: error
        throw error;
    }
}

async function findClientSessionsByProviderSocketId(socketId) {
    try {
        const providerName = await findProviderNameBySocketId(socketId);
        return await findClientSessionsByProviderName(providerName);
    } catch (error) {
        // todo: error
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
        // todo: error
        throw error;
    }
}

module.exports = {
    createNewProviderSession: createNewProviderSession,
    findProviderSocketIdByProviderName: findProviderSocketIdByProviderName,
    findProviderSocketIdByClientSocketId: findProviderSocketIdByClientSocketId,
    findProviderNameBySocketId: findProviderNameBySocketId,
    findClientSessionsByProviderSocketId: findClientSessionsByProviderSocketId,
    deleteProviderSession: deleteProviderSession
};