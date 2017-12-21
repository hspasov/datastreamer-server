const fs = require("fs");
const path = require("path").posix;
const jwt = require("jsonwebtoken");
const passport = require("passport");
const config = require("./config");
const db = require("../db");
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
    db.query("SELECT 1 FROM Providers WHERE Id = $1;", [id]).then(provider => {
        done(null, provider);
    }).catch(error => {
        log.error(error);
    });
});

passport.use(
    "provider-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    },
        (req, username, password, done) => {
            let dbUsername;
            db.query("SELECT Username FROM Providers WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]).then(response => {
                console.log(response.rows);
                if (response.rows.length <= 0) {
                    throw "Provider does not exist";
                }
                dbUsername = response.rows[0].username;
                return fs.readFileAsync(path.join(__dirname, "./privkey.pem"));
            }).then(certificate => {
                return jwt.signAsync({
                    username: dbUsername
                }, certificate, {
                        issuer: "datastreamer-server",
                        subject: "provider",
                        algorithm: "RS256",
                        expiresIn: 60 * 60 // 1 hour
                    });
            }).then(token => {
                done(null, {
                    token,
                    username: dbUsername
                });
            }).catch(error => {
                done(null, false, errorHandler(error));
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
            let dbUsername;
            db.query("SELECT 1 FROM Providers WHERE Username = $1;", [username]).then(response => {
                console.log(response.rows);
                if (response.rows.length > 0) {
                    throw "username already exists";
                }
                return db.query("INSERT INTO Providers (Username, Password, Readable, Writable) VALUES ($1, crypt($2, gen_salt('bf', 8)), FALSE, FALSE) RETURNING *;", [username, password]);
            }).then(response => {
                dbUsername = response.rows[0].username;
                log.info("New provider successfully created...");
                log.info(`username: ${dbUsername}`);
                return fs.readFileAsync(path.join(__dirname, "./privkey.pem"));
            }).then(certificate => {
                return jwt.signAsync({
                    username: dbUsername
                }, certificate, {
                        issuer: "datastreamer-server",
                        subject: "provider",
                        algorithm: "RS256",
                        expiresIn: 60 * 60 // 1 hour
                    });
            }).then(token => {
                done(null, {
                    token,
                    username: dbUsername
                });
            }).catch(error => {
                done(null, false, errorHandler(error));
            });
        }
    )
);

module.exports = passport;