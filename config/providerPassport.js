var passport = require("passport");
var config = require("./config");
var Provider = require("../models/provider");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;

var host = config.host;
var LocalStrategy = require("passport-local").Strategy;

passport.serializeUser(function (provider, done) {
    done(null, provider.id);
});

passport.deserializeUser(function (id, done) {
    Provider.findById(id, function (error, provider) {
        if (error) {
            console.error("There was an error accessing the records of" +
                " provider with id: " + id);
            return console.log(error.message);
        }
        return done(null, provider);
    })
});

passport.use(
    "local-login",
    new LocalStrategy({
        usernameField: "name",
        passwordField: "password",
        passReqToCallback: true
    },
    function (req, name, password, done) {
        Provider.findOne({ name: name }, function (error, provider) {
            if (error) {
                return errorHandler(error);
            }
            if (!provider) {
                return done(null, false, {
                    errorMsg: "Provider does not exist, please" +
                    " <a class=\"errorMsg\" href=\"/signup\">signup</a>"
                });
            }
            if (!provider.validPassword(password)) {
                return done(null, false, { errorMsg: "Invalid password try again" });
            }
            return done(null, provider);
        });

    }));

passport.use(
    "local-signup",
    new LocalStrategy({
        usernameField: "name",
        passwordField: "password",
        passReqToCallback: true
    },
        function (req, name, password, done) {
            process.nextTick(function () {
                Provider.findOne({ name: name }, function (error, provider) {
                    if (error) {
                        return errorHandler(error);
                    }
                    if (provider) {
                        return done(null, false, { errorMsg: "name already exists" });
                    }
                    else {
                        var newProvider = new Provider();
                        newProvider.name = name;
                        newProvider.password = newProvider.generateHash(password);
                        newProvider.save(function (error) {
                            if (error) {
                                console.log(error);
                                if (error.message == "Provider validation failed") {
                                    console.log(error.message);
                                    return done(null, false, { errorMsg: "Please fill all fields" });
                                }
                                return errorHandler(error);
                            }
                            console.log("New provider successfully created...");
                            console.log("name", name);
                            return done(null, newProvider);
                        });
                    }
                });
            });
        }));

module.exports = passport;