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

function createNewProviderSession(socketId, providerName) {
    return new Promise((resolve, reject) => {
        redisClient.multi()
            .smembers(`${providerName}:clientSocketIds`)
            .sadd("providers", providerName)
            .set(`${socketId}:providerName`, providerName)
            .set(`${providerName}:socketId`, socketId)
            .set(`${providerName}:created`, new Date().getTime())
            .execAsync().then(response => {
                log.info("New provider session successfully created...");
                log.verbose(`Redis response: ${response}`);
                resolve({
                    type: "provider",
                    clientSocketIds: response[0],
                    socketId,
                    providerName
                });
            }).catch(error => {
                log.error("There was an error creating the provider session");
                reject(errorHandler(error));
            });
    });
}

function findProviderSocketIdByProviderName(providerName) {
    return new Promise((resolve, reject) => {
        redisClient.getAsync(`${providerName}:socketId`).then(socketId => {
            resolve(socketId);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findProviderSocketIdByClientSocketId(clientSocketId) {
    return new Promise((resolve, reject) => {
        redisClient.getAsync(`${clientSocketId}:providerName`).then(providerName => {
            return findProviderSocketIdByProviderName(providerName);
        }).then(providerSocketId => {
            resolve(providerSocketId);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findProviderNameBySocketId(socketId) {
    return new Promise((resolve, reject) => {
        redisClient.getAsync(`${socketId}:providerName`).then(providerName => {
            resolve(providerName);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findClientSessionsByProviderName(providerName) {
    return new Promise((resolve, reject) => {
        redisClient.smembersAsync(`${providerName}:clientSocketIds`).then(clientSessions => {
            resolve(clientSessions);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findClientSessionsByProviderSocketId(socketId) {
    return new Promise((resolve, reject) => {
        findProviderNameBySocketId(socketId).then(providerName => {
            return findClientSessionsByProviderName(providerName);
        }).then(clientSessions => {
            resolve(clientSessions);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function deleteProviderSession(socketId) {
    return new Promise((resolve, reject) => {
        findProviderNameBySocketId(socketId).then(providerName => {
            redisClient.multi()
                .get(`${providerName}:socketId`)
                .smembers(`${providerName}:clientSocketIds`)
                .srem("providers", providerName)
                .del(`${socketId}:providerName`)
                .del(`${providerName}:socketId`)
                .del(`${providerName}:created`)
                .execAsync().then(response => {
                    log.verbose(`execAsync at deleteProviderSession: ${response}`);
                    resolve({
                        socketId: response[0],
                        providerName,
                        clientSocketIds: response[1]
                    });
                }).catch(error => {
                    reject(errorHandler(error));
                });
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

module.exports = {
    createNewProviderSession: createNewProviderSession,
    findProviderSocketIdByProviderName: findProviderSocketIdByProviderName,
    findProviderSocketIdByClientSocketId: findProviderSocketIdByClientSocketId,
    findProviderNameBySocketId: findProviderNameBySocketId,
    findClientSessionsByProviderSocketId: findClientSessionsByProviderSocketId,
    deleteProviderSession: deleteProviderSession
};