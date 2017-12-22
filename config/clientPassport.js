const fs = require("fs");
const path = require("path").posix;
const passport = require("passport");
const config = require("./config");
const db = require("../db");
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
const checkIfInvalidated = require("../actions/streamSession").checkIfInvalidated;

passport.serializeUser((client, done) => {
    log.verbose(`Serializing user: ${client}`);
    done(null, client);
});

passport.deserializeUser((id, done) => {
    db.query("SELECT 1 FROM Clients WHERE Id = $1", [id]).then(client => {
        done(null, client);
    }).catch(error => {
        log.error(error);
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
            let dbUsername;
            db.query("SELECT 1 FROM Clients WHERE Username = $1;", [username]).then(response => {
                if (response.rows.length > 0) {
                    throw "username already exists";
                }
                return db.query("INSERT INTO Clients (Username, Password) VALUES ($1, crypt($2, gen_salt('bf', 8))) RETURNING *;", [username, password]);
            }).then(response => {
                console.log(response);
                dbUsername = response.rows[0].username;
                log.info("New client successfully created...");
                log.info(`username: ${dbUsername}`);
                return fs.readFileAsync(path.join(__dirname, "./privkey.pem"));
            }).then(certificate => {
                return jwt.signAsync({
                    username: dbUsername
                }, certificate, {
                        issuer: "datastreamer-server",
                        subject: "client",
                        algorithm: "RS256",
                        expiresIn: 60 * 60 // 1 hour
                    });
            }).then(token => {
                done(null, {
                    token,
                    username: dbUsername
                });
            }).catch(error => {
                console.log(error);
                done(null, false, { errorMsg: "username already exists" });
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
        let dbUsername;
        db.query("SELECT Username FROM Clients WHERE Username = $1 AND Password = crypt($2, Password);", [username, password]).then(response => {
            console.log(response.rows);
            if (response.rows.length <= 0) {
                throw "Client does not exist";
            }
            dbUsername = response.rows[0].username;
            return fs.readFileAsync(path.join(__dirname, "./privkey.pem"));
        }).then(certificate => {
            return jwt.signAsync({
                username: dbUsername
            }, certificate, {
                    issuer: "datastreamer-server",
                    subject: "client",
                    algorithm: "RS256",
                    expiresIn: 60 * 60 // 1 hour
                });
        }).then(token => {
            done(null, {
                token,
                username: dbUsername
            });
        }).catch(error => {
            console.log(error);
            done(null, false, {
                errorMsg: error
            });
        });
    })
);

passport.use("client-connect", new CustomStrategy((req, done) => {
    let dbUsername, accessRules, jwtDecoded;
    checkIfInvalidated(req.body.token).then(isInvalidated => {
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
        jwtDecoded = decoded;
        return db.query(`SELECT Username, Readable, Writable
            FROM Providers
            WHERE Username = $1 AND Password = crypt($2, Password);`, [req.body.username, req.body.password]);
    }).then(response => {
        console.log(response.rows);
        if (response.rows.length <= 0) {
            throw "Provider does not exist";
        }
        dbUsername = response.rows[0].username;
        const readAccess = response.rows[0].readable;
        const writeAccess = response.rows[0].writable;
        if (readAccess === false && writeAccess === false) {
            accessRules = "N";
        } else if (readAccess === true && writeAccess === false) {
            accessRules = "R";
        } else if (readAccess === true && writeAccess === true) {
            accessRules = "RW";
        }
        console.log(accessRules);
        return db.query(`SELECT Providers.Username, ClientAccessRules.Readable, ClientAccessRules.Writable
            FROM ClientAccessRules INNER JOIN Providers
            ON ClientAccessRules.ProviderId = Providers.Id
            INNER JOIN Clients ON ClientAccessRules.ClientId = Clients.Id
            WHERE Providers.Username = $1 AND Clients.Username = $2;`, [req.body.username, jwtDecoded.username]);
    }).then(response => {
        console.log(response.rows);
        if (response.rows.length > 0) {
            const readAccess = response.rows[0].readable;
            const writeAccess = response.rows[0].writable;
            if (readAccess === false && writeAccess === false) {
                accessRules = "N";
            } else if (readAccess === true && writeAccess === false) {
                accessRules = "R";
            } else if (readAccess === true && writeAccess === true) {
                accessRules = "RW";
            }
            console.log(accessRules);
        }
        return fs.readFileAsync(path.join(__dirname, "./privkey.pem"));
    }).then(privateKey =>{
        return jwt.signAsync({
            client: jwtDecoded.username,
            provider: dbUsername,
            accessRules
        }, privateKey, {
                issuer: "datastreamer-server",
                subject: "clientConnection",
                algorithm: "RS256",
                expiresIn: 60 * 60 // 1 hour
            });
    }).then(token => {
        done(null, {
            token,
            username: dbUsername,
            accessRules
        });
    }).catch(error => {
        log.error("While connecting:");
        log.error(error.name);
        log.error(error.message);
        done(null, false, errorHandler(error));
    });
}));

module.exports = passport;