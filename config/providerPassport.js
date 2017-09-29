const passport = require("passport");
const config = require("./config");
const Provider = require("../models/provider");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;

const host = config.host;
const LocalStrategy = require("passport-local").Strategy;

passport.serializeUser((provider, done) => {
    done(null, provider.id);
});

passport.deserializeUser((id, done) => {
    Provider.findById(id, (error, provider) => {
        return error ?
            console.log(error.message) : done(null, provider);
    })
});

passport.use(
    "provider-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    },
        (req, username, password, done) => {
            Provider.findOne({ username }, (error, provider) => {
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
        }
    )
);

passport.use(
    "provider-register",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    },
        (req, username, password, done) => {
            process.nextTick(() => {
                Provider.findOne({ username }, (error, provider) => {
                    if (error) {
                        return errorHandler(error);
                    }
                    if (provider) {
                        return done(null, false, { errorMsg: "username already exists" });
                    }
                    else {
                        let newProvider = new Provider();
                        newProvider.username = username;
                        newProvider.password = newProvider.generateHash(password);
                        newProvider.save(error => {
                            if (error) {
                                console.log(error);
                                if (error.message == "Provider validation failed") {
                                    console.log(error.message);
                                    return done(null, false, { errorMsg: "Please fill all fields" });
                                }
                                return errorHandler(error);
                            }
                            console.log("New provider successfully created...");
                            console.log("username", username);
                            return done(null, newProvider);
                        });
                    }
                });
            });
        }
    )
);

module.exports = passport;