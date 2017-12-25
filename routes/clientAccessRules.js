const log = require("../modules/log");
const express = require("express");
const router = express.Router();
const {
    setClientRule,
    setProviderDefaultRule,
    getProviderDefaultRule
} = require("../db/postgres/clientAccessRules");

router.post("/client", (req, res, next) => {
    setClientRule(
        req.body.providerToken,
        req.body.connectionToken,
        req.body.readable,
        req.body.writable
    ).then(response => {
        if (response.success) {
            res.status(200).send({
                readable: response.readable,
                writable: response.writable
            });
        } else {
            res.status(401).send({ reason: response.reason });
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/provider", (req, res, next) => {
    getProviderDefaultRule(req.body.token).then(response => {
        if (response.success) {
            res.status(200).send({
                readable: response.readable,
                writable: response.writable
            });
        } else {
            res.status(401).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/default", (req, res, next) => {
    setProviderDefaultRule(
        req.body.token,
        req.body.readable,
        req.body.writable
    ).then(response => {
        if (response.success) {
            res.status(200).send({
                readable: response.readable,
                writable: response.writable
            });
        } else {
            res.status(401).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

module.exports = router;