const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    verbose: debug("datastreamer-server:verbose")
};

const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewClientSession(redisClient, socketId, providerName) {
    return new Promise((resolve, reject) => {
        redisClient.multi()
            .sadd("clients", socketId)
            .sadd(`${providerName}:clientSocketIds`, socketId)
            .set(`${socketId}:providerName`, providerName)
            .set(`${socketId}:created`, new Date().getTime())
            .execAsync().then(response => {
                log.info(`New client session successfully created...`);
                log.verbose(`Redis response: ${response}`);
                resolve(socketId);
            }).catch(error => {
                log.info(`There was an error creating the client session for client "${socketId}": ${error}`);
                reject(errorHandler(error));
            });
    });
}

function findClientSession(redisClient, socketId) {
    return new Promise((resolve, reject) => {
        redisClient.sismemberAsync("clients", socketId).then(response => {
            // todo: verbose
            resolve(response);
        }).catch(error => {
            // todo: info
            reject(errorHandler(error));
        });
    });
}

function deleteClientSession(redisClient, socketId) {
    return new Promise((resolve, reject) => {
        let providerName = "";
        redisClient.getAsync(`${socketId}:providerName`).then(response => {
            providerName = response;
            redisClient.multi()
                .srem("clients", socketId)
                .srem(`${providerName}:clientSocketIds`, socketId)
                .del(`${socketId}:providerName`)
                .del(`${socketId}:created`)
                .execAsync()
        }).then(response => {
                log.info(`Deleted client session "${socketId}" with provider "${providerName}"`);
                resolve({ socketId, providerName });
        }).catch(error => {
            // todo: info
            reject(errorActions(error));
        });
    });
}

module.exports = {
    createNewClientSession: createNewClientSession,
    findClientSession: findClientSession,
    deleteClientSession: deleteClientSession
};