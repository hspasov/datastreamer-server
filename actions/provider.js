var ProviderModel = require("../models/provider");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewProvider(request, response) {
    return ProviderModel.create({
        name: request.body.name,
        password: request.body.password
    }, function (error, provider) {
        if (error) {
            console.error("There was an error creating the provider");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return validationError(error, response);
            }
            else {
                return errorHandler(error);
            }
        }
        console.log("New provider successfully created...");
        console.log(provider.name);
        return response.json({
            msg: "Provider created!",
            id: provider._id,
            name: provider.name
        });
    });
}

function findProvider(request, response) {
    return ProviderModel.findOne({ name: request.params.name }, "name",
        function (error, provider) {
            if (error) {
                return errorHandler(error);
            }
            if (provider == null) {
                return response.json({
                    msg: "Provider does not exist in the dBase"
                });
            }
            console.log(provider.name);
            return response.json(provider);
        }
    );
}

function viewAllProviders(request, response) {
    return ProviderModel.find({},
        function (error, provider) {
            if (error) {
                return errorHandler(error);
            }
            console.log(provider);
            return response.json(providers);
        }
    );
}

function updateProvider(request, response) {
    return ProviderModel.findOne({ name: request.params.name },
        function (error, provider) {
            if (error) {
                return errorHandler(error);
            }
            console.log(provider);
            provider.name = request.body.provider;
            provider.password = request.body.password;
            provider.save(function (error, provider) {
                if (error) {
                    return errorHandler(error);
                }
                console.log("Provider updated: ", provider);
                return response.json(provider);
            })
        }
    );
}

function deleteProvider(request, response) {
    return ProviderModel.findOneAndRemove({ name: request.params.name },
        function (error, provider) {
            if (error) {
                return errorHandler(error);
            }
            console.log("Provider deleted ", provider);
            return response.json(provider);
        }
    );
}

module.exports = {
    createNewProvider: createNewProvider,
    findClient: findProvider,
    viewAllProviders: viewAllProviders,
    updateProvider: updateProvider,
    deleteProvider: deleteProvider
}