const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const config = require("./config");
const Provider = require("../models/provider");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const host = config.host;
const LocalStrategy = require("passport-local").Strategy;

passport.serializeUser((provider, done) => {
    done(null, provider.id);
});

passport.deserializeUser((id, done) => {
    Provider.findById(id, (error, provider) => {
        return error ?
            log.error(error.message) : done(null, provider);
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
                fs.readFileAsync(path.join(__dirname, "./privkey.pem")).then(certificate => {
                    return jwt.signAsync({
                        username: provider.username
                    }, certificate, {
                        issuer: "datastreamer-server",
                        subject: "provider",
                        algorithm: "RS256",
                        expiresIn: 60 * 60 // 1 hour
                    });
                }).then(token =>{
                    return done(null, {
                        token,
                        username: provider.username
                    });
                }).catch(error => {
                    return done(null, false, errorHandler(error));
                });
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
                            log.error(error);
                            if (error.message == "Provider validation failed") {
                                log.error(error.message);
                                return done(null, false, { errorMsg: "Please fill all fields" });
                            }
                            return errorHandler(error);
                        }
                        log.info("New provider successfully created...");
                        log.info(`username: ${username}`);
                        fs.readFileAsync(path.join(__dirname, "./privkey.pem")).then(certificate => {
                            return jwt.signAsync({
                                username: newProvider.username
                            }, certificate, {
                                issuer: "datastreamer-server",
                                subject: "provider",
                                algorithm: "RS256",
                                expiresIn: 60 * 60 // 1 hour
                            });
                        }).then(token =>{
                            return done(null, {
                                token,
                                username: newProvider.username
                            });
                        }).catch(error => {
                            return done(null, false, errorHandler(error));
                        });
                    });
                }
            });
        }
    )
);

module.exports = passport;