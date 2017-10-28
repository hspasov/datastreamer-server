const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const ClientModel = require("../models/client");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewClient(request, response) {
    return ClientModel.create({
        username: request.body.username,
        password: request.body.password
    }, (error, client) => {
        if (error) {
            log.error(`There was an error creating the client: code ${error.code}, errorName: ${error.name}`);
            if (error.name == "validationerror") {
                return validationError(error, response);
            } else {
                return errorHandler(error);
            }
        }
        log.info(`New client "${client.username}" successfully created `);
        return response.json({
            msg: "Client created!",
            username: client.username
        });
    });
}

function findClient(request, response) {
    return ClientModel.findOne({ username: request.params.username }, "username",
        (error, client) => {
            if (error) {
                return errorHandler(error);
            }
            if (client == null) {
                return response.json({
                    msg: "Client does not exist in the dBase, please" +
                    " sign up to login as a client"
                });
            }
            log.verbose(`Function findClient executed. Found client "${client.username}"`);
            return response.json(client);
        }
    );
}

function updateClient(request, response) {
    return ClientModel.findOne({ username: request.params.username },
        (error, client) => {
            if (error) {
                return errorHandler(error);
            }
            client.username = request.body.username;
            client.password = request.body.password;
            client.save((error, client) => {
                if (error) {
                    return errorHandler(error);
                }
                log.info(`Client updated: "${client.username}"`);
                return response.json(client);
            });
        }
    );
}

function deleteClient(request, response) {
    return ClientModel.findOneAndRemove({ username: request.params.username },
        (error, client) => {
            if (error) {
                return errorHandler(error);
            }
            log.info(`Client deleted: "${client}"`);
            return response.json(client);
        }
    );
}

module.exports = {
    createNewClient: createNewClient,
    findClient: findClient,
    updateClient: updateClient,
    deleteClient: deleteClient
};