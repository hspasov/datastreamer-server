var passport = require("passport");
var config = require("./config");
var Client = require("../models/client");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;

var host = config.host;
var LocalStrategy = require("passport-local").Strategy;

passport.serializeUser(function (client, done) {
    done(null, client.id);
});

passport.deserializeUser(function (id, done) {
    Client.findById(id, function (error, client) {
        if (error) {
            console.error("There was an error accessing the records of" +
                " client with id: " + id);
            return console.log(error.message);
        }
        return done(null, client);
    })
});

passport.use(
    "local-signup",
    new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    },
    function (req, email, password, done) {
        process.nextTick(function () {
            Client.findOne({ email: email }, function (error, client) {
                if (error) {
                    return errorHandler(error);
                }
                if (client) {
                    return done(null, false, { errorMsg: "email already exists" });
                }
                else {
                    var newClient = new Client();
                    newClient.email = email;
                    newClient.password = newClient.generateHash(password);
                    newClient.save(function (error) {
                        if (error) {
                            console.log(error);
                            if (error.message == "Client validation failed") {
                                console.log(error.message);
                                return done(null, false, { errorMsg: "Please fill all fields" });
                            }
                            return errorHandler(error);
                        }
                        console.log("New client successfully created...");
                        console.log("email", email);
                        return done(null, newClient);
                    });
                }
            });
        });
    }));

passport.use(
    "local-login",
    new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    },
        function (req, email, password, done) {
        Client.findOne({ email: email }, function (error, client) {
            if (error) {
                return errorHandler(error);
            }
            if (!client) {
                return done(null, false, {
                    errorMsg: "Client does not exist, please" +
                    " <a class=\"errorMsg\" href=\"/signup\">signup</a>"
                });
            }
            if (!client.validPassword(password)) {
                return done(null, false, { errorMsg: "Invalid password try again" });
            }
            return done(null, client);
        });

    }));

module.exports = passport;