const passport = require("passport");
const config = require("./config");
const Client = require("../models/client");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;

const host = config.host;
const LocalStrategy = require("passport-local").Strategy;

passport.serializeUser((client, done) => {
    done(null, client.id);
});

passport.deserializeUser((id, done) => {
    Client.findById(id, (error, client) => {
        return error ?
            console.log(error.message) : done(null, client);
    });
});

passport.use(
    "client-register",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    },
        (req, username, password, done) => {
            process.nextTick(() => {
                Client.findOne({ username }, (error, client) => {
                    if (error) {
                        return errorHandler(error);
                    } else if (client) {
                        return done(null, false, { errorMsg: "username already exists" });
                    } else {
                        let newClient = new Client();
                        newClient.username = username;
                        newClient.password = newClient.generateHash(password);
                        newClient.save(error => {
                            if (error) {
                                console.log(error);
                                if (error.message == "Client validation failed") {
                                    console.log(error.message);
                                    return done(null, false, { errorMsg: "Please fill all fields" });
                                }
                                return errorHandler(error);
                            }
                            console.log("New client successfully created...");
                            console.log("username", username);
                            return done(null, newClient);
                        });
                    }
                });
            });
        }
    )
);

passport.use(
    "client-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    },
        (req, username, password, done) => {
            Client.findOne({ username }, (error, client) => {
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
        }
    )
);

module.exports = passport;