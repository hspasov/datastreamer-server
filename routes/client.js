const path = require("path").posix;
const express = require("express");
const client = require("../db/postgres/client");
const register = client.register;
const login = client.login;
const connect = client.connect;
const invalidateToken = require("../db/redis/streamSession").invalidateToken;
const router = express.Router();

const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

router.route(["/login", "/register", "/home", "/connect", "/",]).get((req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", (req, res, next) => {
    // todo: handle errors
    login(req.body.username, req.body.password).then(response => {
        res.status(200).send({
            token: response.token,
            username: response.username
        });
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});


router.post("/register", (req, res, next) => {
    // todo: handle errors
    register(req.body.username, req.body.password).then(response => {
        res.status(201).send({
            token: response.token,
            username: response.username
        });
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/connect", (req, res, next) => {
    // todo: handle errors
    connect(req.body.token, req.body.username, req.body.password).then(response => {
        res.status(200).send({
            token: response.token,
            username: response.username,
            accessRules: response.accessRules
        });
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/disconnect", (req, res, next) => {
    invalidateToken(req.body.connectionToken).then(() => {
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(400).end();
    });
});

router.post("/logout", (req, res, next) => {
    invalidateToken(req.body.clientToken).then(success => {
        if (!success) {
            throw `Can't invalidate session. Invalid client token "${req.body.clientToken}" was sent.`;
        }
        return invalidateToken(req.body.connectionToken);
    }).then(success => {
        if (!success) {
            log.info("Client was not connected to provider when requested to log out.");
        }
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(400).end();
    });
});

module.exports = router;
