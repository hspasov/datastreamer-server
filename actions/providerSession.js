const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewProviderSession(redisClient, socketId, providerName) {
    return new Promise((resolve, reject) => {
        redisClient.multi()
            .sadd("providers", providerName)
            .set(`${socketId}:providerName`, providerName)
            .set(`${providerName}:socketId`, socketId)
            .set(`${providerName}:created`, new Date().getTime())
            .execAsync().then(response => {
                console.log("New provider session successfully created...");
                console.log(response);
                resolve({
                    type: "provider",
                    socketId: socketId,
                    providerName: providerName
                });
            }).catch(error => {
                console.error("There was an error creating the provider session");
                reject(errorHandler(error));
            });
    });
}

function findProviderSocketIdByProviderName(redisClient, providerName) {
    return new Promise((resolve, reject) => {
        redisClient.getAsync(`${providerName}:socketId`).then(socketId => {
            resolve(socketId);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findProviderNameBySocketId(redisClient, socketId) {
    return new Promise((resolve, reject) => {
        redisClient.getAsync(`${socketId}:providerName`).then(providerName => {
            resolve(providerName);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findClientSessionsByProviderName(redisClient, providerName) {
    return new Promise((resolve, reject) => {
        redisClient.smembersAsync(`${providerName}:clientSocketIds`).then(clientSessions => {
            resolve(clientSessions);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function deleteProviderSession(redisClient, socketId) {
    return new Promise((resolve, reject) => {
        findProviderNameBySocketId(redisClient, socketId).then(providerName => {
            redisClient.multi()
                .get(`${providerName}:socketId`)
                .smembers(`${providerName}:clientSocketIds`)
                .srem("providers", providerName)
                .del(`${socketId}:providerName`)
                .del(`${providerName}:socketId`)
                .del(`${providerName}:created`)
                .execAsync().then(response => {
                    console.log("execAsync at deleteProviderSession:");
                    console.log(response);
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
    findProviderNameBySocketId: findProviderNameBySocketId,
    findClientSessionsByProviderName: findClientSessionsByProviderName,
    deleteProviderSession: deleteProviderSession
};