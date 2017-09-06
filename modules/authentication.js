var UserModel = require("../models/user");

function validationError(error, response) {
    Object.keys(error.errors).forEach(function (k) {
        var msg = error.errors[k].message;
        console.error("Validation error for \"%s" + ": %s", k, msg);
        return response.status(404).json({
            msg: "Please ensure requestuired fields are filled"
        });
    });
}

function createNewUser(request, response) {
    return UserModel.create({
        email: request.body.email,
        password: request.body.password,
    }, function (error, user) {
        if (error) {
            console.error("There was an error creating the user");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return validationError(error, response);
            }
            else {
                return errorHandler(error);
            }
        }
        console.log("New user successfully created...");
        console.log(user.email);
        return response.json({
            msg: "User created!",
            id: user._id,
            email: user.email
        });
    })
}

function findUser(request, response) {
    return UserModel.findOne({ email: request.params.email }, "email",
        function (error, user) {
            if (error) {
                return errorHandler(error);
            }
            if (user == null) {
                return response.json({
                    msg: "User does not exist in the dBase, please" +
                    " sign up to login as a user"
                });
            }
            console.log(user.email);
            return response.json(user);
        }
    );
}

function viewAllUsers(request, response) {
    return UserModel.find({},
        function (error, users) {
            if (error) {
                return errorHandler(error);
            }
            console.log(users);
            return response.json(users);
        }
    );
}

function updateUser(request, response) {
    return UserModel.findOne({ email: request.params.email },
        function (error, user) {
            if (error) {
                return errorHandler(error);
            }
            console.log(user);
            user.email = request.body.email;
            user.password = request.body.password;
            user.save(function (error, user) {
                if (error) {
                    return errorHandler(error);
                }
                console.log("User updated: ", user);
                return response.json(user);
            });
        }
    );
}

function deleteUser(request, response) {
    return UserModel.findOneAndRemove({ email: request.params.email },
        function (error, user) {
            if (error) {
                return errorHandler(error);
            }
            console.log("User deleted ", user);
            return response.json(user);
        }
    );
}

module.exports = {
    validationError: validationError,
    createNewUser: createNewUser,
    findUser: findUser,
    viewAllUsers: viewAllUsers,
    updateUser: updateUser,
    deleteUser: deleteUser
};