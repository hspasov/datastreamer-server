var ClientModel = require("../models/client");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewClient(request, response) {
    return ClientModel.create({
        email: request.body.email,
        password: request.body.password
    }, function (error, client) {
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
        console.log(client.email);
        return response.json({
            msg: "Client created!",
            id: client._id,
            email: client.email
        });
    });
}

function findClient(request, response) {
    return ClientModel.findOne({ email: request.params.email }, "email",
        function (error, client) {
            if (error) {
                return errorHandler(error);
            }
            if (client == null) {
                return response.json({
                    msg: "Client does not exist in the dBase, please" +
                    " sign up to login as a client"
                });
            }
            console.log(client.email);
            return response.json(client);
        }
    );
}

function viewAllClients(request, response) {
    return ClientModel.find({},
        function (error, clients) {
            if (error) {
                return errorHandler(error);
            }
            console.log(clients);
            return response.json(clients);
        }
    );
}

function updateClient(request, response) {
    return ClientModel.findOne({ email: request.params.email },
        function (error, client) {
            if (error) {
                return errorHandler(error);
            }
            console.log(client);
            client.email = request.body.email;
            client.password = request.body.password;
            client.save(function (error, client) {
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
    return ClientModel.findOneAndRemove({ email: request.params.email },
        function (error, client) {
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