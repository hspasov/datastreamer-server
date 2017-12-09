const path = require("path");
const express = require("express");
const clientPassport = require("../config/clientPassport");
const invalidateToken = require("../actions/streamSession").invalidateToken;
const router = express.Router();

const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

router.use(clientPassport.initialize());
router.use(clientPassport.session());

router.route(["/login", "/register", "/home", "/connect", "/",]).get((req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", (req, res, next) => {
    clientPassport.authenticate("client-login", { session: false }, (err, client) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(client, err => {
            return err ?
                next(err) : res.status(200).send({
                    token: client.token
                });
        });
    })(req, res, next);
});


router.post("/register", (req, res, next) => {
    clientPassport.authenticate("client-register", { session: false }, (err, client) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({message: "fail"});
        }
        req.login(client, err => {
            return err ?
                next(err) : res.status(201).send({
                    token: client.token
                });
        });
    })(req, res, next);
});

router.post("/connect", (req, res, next) => {
    clientPassport.authenticate("client-connect", { session: false }, (err, connection) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!connection) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(connection, err => {
            return err ?
                next(err) : res.status(200).send({
                    token: connection.token
                });
        });
    })(req, res, next);
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
