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
            console.error("There was an error creating the client");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return validationError(error, response);
            }
            else {
                return errorHandler(error);
            }
        }
        console.log("New client successfully created...");
        console.log(client.username);
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
            console.log(client.username);
            return response.json(client);
        }
    );
}

function viewAllClients(request, response) {
    return ClientModel.find({},
        (error, clients) => {
            if (error) {
                return errorHandler(error);
            }
            console.log(clients);
            return response.json(clients);
        }
    );
}

function updateClient(request, response) {
    return ClientModel.findOne({ username: request.params.username },
        (error, client) => {
            if (error) {
                return errorHandler(error);
            }
            console.log(client);
            client.username = request.body.username;
            client.password = request.body.password;
            client.save((error, client) => {
                if (error) {
                    return errorHandler(error);
                }
                console.log("Client updated: ", client);
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
            console.log("Client deleted ", client);
            return response.json(client);
        }
    );
}

module.exports = {
    validationError: validationError,
    createNewClient: createNewClient,
    findClient: findClient,
    viewAllClients: viewAllClients,
    updateClient: updateClient,
    deleteClient: deleteClient
};