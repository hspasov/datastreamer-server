const log = require("../modules/log");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator/check");
const {
    setClientRule,
    setProviderDefaultRule,
    getProviderDefaultRule
} = require("../db/postgres/clientAccessRules");

router.post("/client", [
    body("providerToken").exists(),
    body("connectionToken").exists(),
    body("readable").exists().isBoolean(),
    body("writable").exists().isBoolean()
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
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
    }
});

router.post("/provider", [
    body("token").exists()
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
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
    }
});

router.post("/default", [
    body("token").exists(),
    body("readable").exists().isBoolean(),
    body("writable").exists().isBoolean()
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
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
    }
});

module.exports = router;