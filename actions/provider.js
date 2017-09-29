const ProviderModel = require("../models/provider");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewProvider(request, response) {
    return ProviderModel.create({
        username: request.body.username,
        password: request.body.password
    }, (error, provider) => {
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
        console.log(provider.username);
        return response.json({
            msg: "Provider created!",
            username: provider.username
        });
    });
}

function findProvider(request, response) {
    return ProviderModel.findOne({ username: request.params.username }, "username",
        (error, provider) => {
            if (error) {
                return errorHandler(error);
            }
            if (provider == null) {
                return response.json({
                    msg: "Provider does not exist in the dBase"
                });
            }
            console.log(provider.username);
            return response.json(provider);
        }
    );
}

function viewAllProviders(request, response) {
    return ProviderModel.find({},
        (error, provider) => {
            return error ?
                errorHandler(error) : response.json(providers);
        }
    );
}

function updateProvider(request, response) {
    return ProviderModel.findOne({ username: request.params.username },
        (error, provider) => {
            if (error) {
                return errorHandler(error);
            }
            provider.username = request.body.provider;
            provider.password = request.body.password;
            provider.save((error, provider) => {
                return error ?
                    errorHandler(error) : response.json(provider);
            })
        }
    );
}

function deleteProvider(request, response) {
    return ProviderModel.findOneAndRemove({ username: request.params.username },
        (error, provider) => {
            return error ?
                errorHandler(error) : response.json(provider);
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