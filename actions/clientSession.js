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
                console.log("New client session successfully created...");
                console.log(response);
                resolve(socketId);
            }).catch(error => {
                console.log("There was an error creating the client session");
                console.log(error);
                reject(errorHandler(error));
            });
    });
}

function findClientSession(redisClient, socketId) {
    return new Promise((resolve, reject) => {
        redisClient.sismemberAsync("clients", socketId).then(response => {
            resolve(response);
        }).catch(error => {
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
                console.log("Deleted client session", providerName, response);
                resolve({ socketId, providerName });
        }).catch(error => {
            reject(errorActions(error));
        });
    });
}

module.exports = {
    createNewClientSession: createNewClientSession,
    findClientSession: findClientSession,
    deleteClientSession: deleteClientSession
};