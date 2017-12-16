const fs = require("fs");
const path = require("path");
const passport = require("passport");
const config = require("./config");
const Client = require("../models/client");
const Provider = require("../models/provider");
const errorActions = require("../modules/errorActions");
const jwt = require("jsonwebtoken");

const errorHandler = errorActions.errorHandler;
const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const host = config.host;
const LocalStrategy = require("passport-local").Strategy;
const CustomStrategy = require("passport-custom");
const isInvalidated = require("../actions/streamSession").isInvalidated;

passport.serializeUser((client, done) => {
    log.verbose(`Serializing user: ${client}`);
    done(null, client);
});

passport.deserializeUser((id, done) => {
    Client.findById(id, (error, client) => {
        return error ?
            log.error(error.message) : done(null, client);
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
                            log.error(error);
                            if (error.message === "Client validation failed") {
                                log.error(error.message);
                                return done(null, false, { errorMsg: "Please fill all fields" });
                            }
                            return errorHandler(error);
                        }
                        log.info("New client successfully created...");
                        log.info(`username: ${username}`);
                        fs.readFileAsync(path.join(__dirname, "./privkey.pem")).then(certificate => {
                            return jwt.signAsync({
                                username: newClient.username
                            }, certificate, {
                                issuer: "datastreamer-server",
                                subject: "client",
                                algorithm: "RS256",
                                expiresIn: 60 * 60 // 1 hour
                            });
                        }).then(token => {
                            return done(null, {
                                token,
                                username: newClient.username
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

passport.use(
    "client-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    }, (req, username, password, done) => {
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
            fs.readFileAsync(path.join(__dirname, "./privkey.pem")).then(certificate => {
                return jwt.signAsync({
                    username: client.username
                }, certificate, {
                    issuer: "datastreamer-server",
                    subject: "client",
                    algorithm: "RS256",
                    expiresIn: 60 * 60 // 1 hour
                });
            }).then(token => {
                return done(null, {
                    token,
                    username
                });
            }).catch(error => {
                return done(null, false, errorHandler(error));
            });
        });
    })
);

passport.use("client-connect", new CustomStrategy((req, done) => {
    isInvalidated(req.body.token).then(isInvalidated => {
        if (isInvalidated) {
            throw "Authentication failed. Token has been invalidated.";
        } else {
            return fs.readFileAsync(path.join(__dirname, "./pubkey.pem"));
        }
    }).then(publicKey => {
        return jwt.verifyAsync(req.body.token, publicKey, {
            issuer: "datastreamer-server",
            subject: "client",
            algorithm: "RS256"
        });
    }).then(decoded => {
        Provider.findOne({ username: req.body.username }, (error, provider) => {
            if (error) {
                return done(null, false, errorHandler(error));
            }
            if (!provider) {
                return done(null, false, {
                    errorMsg: "Provider does not exist, please" +
                    " <a class=\"errorMsg\" href=\"/signup\">signup</a>"
                });
            }
            if (!provider.validPassword(req.body.password)) {
                return done(null, false, { errorMsg: "Invalid password try again" });
            }
            fs.readFileAsync(path.join(__dirname, "./privkey.pem")).then(privateKey => {
                return jwt.signAsync({
                    client: decoded.username,
                    provider: provider.username
                }, privateKey, {
                    issuer: "datastreamer-server",
                    subject: "clientConnection",
                    algorithm: "RS256",
                    expiresIn: 60 * 60 // 1 hour
                });
            }).then(token => {
                return done(null, {
                    token,
                    username: provider.username
                });
            });
        });
    }).catch(error => {
        log.error("While connecting:");
        log.error(error.name);
        log.error(error.message);
        return done(null, false, errorHandler(error));
    });
}));

module.exports = passport;