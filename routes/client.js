const log = require("../modules/log");
const path = require("path").posix;
const express = require("express");
const router = express.Router();
const { login, register, connect } = require("../db/postgres/client");
const { invalidateToken } = require("../db/redis/streamSession");

router.route(["/login", "/register", "/home", "/connect", "/",]).get((req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", (req, res, next) => {
    login(req.body.username, req.body.password).then(response => {
        if (response.success) {
            res.status(200).send({
                token: response.token,
                username: response.username
            });
        } else {
            res.status(404).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});


router.post("/register", (req, res, next) => {
    register(req.body.username, req.body.password).then(response => {
        if (response.success) {
            res.status(201).send({
                token: response.token,
                username: response.username
            });
        } else {
            res.status(412).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/connect", (req, res, next) => {
    connect(req.body.token, req.body.username, req.body.password).then(response => {
        if (response.success) {
            res.status(200).send({
                token: response.token,
                username: response.username,
                accessRules: response.accessRules
            });
        } else if (response.reason === "token") {
            res.status(401).end();
        } else if (response.reason === "credentials") {
            res.status(404).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/disconnect", (req, res, next) => {
    invalidateToken(req.body.connectionToken).then(success => {
        if (!success) {
            log.info("Could not invalidate token.");
            log.verbose(req.body.connectionToken);
        }
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/logout", (req, res, next) => {
    invalidateToken(req.body.clientToken).then(success => {
        if (!success) {
            log.info("Could not invalidate token.");
            log.verbose(req.body.clientToken);
        }
        return invalidateToken(req.body.connectionToken);
    }).then(success => {
        if (!success) {
            log.verbose("Client was not connected to provider when requested to log out.");
        }
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

module.exports = router;
