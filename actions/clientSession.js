const redisClient = require("redis").createClient({ detect_buffers: true });

const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

async function createNewClientSession(socketId, providerName) {
    try {
        const response = await redisClient.multi()
            .sismember("providers", providerName)
            .get(`${providerName}:socketId`)
            .sadd("clients", socketId)
            .sadd(`${providerName}:clientSocketIds`, socketId)
            .set(`${socketId}:providerName`, providerName)
            .set(`${socketId}:created`, new Date().getTime())
            .execAsync();
        log.info(`New client session successfully created...`);
        log.verbose(`Redis response: ${response}`);
        return {
            type: "clientConnection",
            provider: {
                providerName,
                isConnected: response[0],
                socketId: response[1]
            }
        };
    } catch (error) {
        log.error(`There was an error creating the client session for client "${socketId}": ${error}`);
        throw error;
    }
}

async function findClientSession(socketId) {
    try {
        return await redisClient.sismemberAsync("clients", socketId);
        // todo: verbose
    } catch (error) {
        // todo: info
        throw error;
    }
}

async function deleteClientSession(socketId) {
    try {
        const providerName = await redisClient.getAsync(`${socketId}:providerName`);
        const response = await redisClient.multi()
            .srem("clients", socketId)
            .srem(`${providerName}:clientSocketIds`, socketId)
            .del(`${socketId}:providerName`)
            .del(`${socketId}:created`)
            .execAsync();
        log.info(`Deleted client session "${socketId}" with provider "${providerName}"`);
        return { socketId, providerName };
    } catch (error) {
        // todo: info
        throw error;
    }
}

module.exports = {
    createNewClientSession: createNewClientSession,
    findClientSession: findClientSession,
    deleteClientSession: deleteClientSession
};